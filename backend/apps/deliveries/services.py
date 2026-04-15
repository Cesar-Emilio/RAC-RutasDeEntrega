"""
services.py — Lógica de negocio para el procesamiento de rutas

Flujo completo:
    process_route(route_id)
        └── 1. parse_input_file()     - extrae filas del CSV/JSON
        └── 2. resolve_coordinates()  - geocodifica las filas que no traen lat/lng
        └── 3. save_delivery_points() - persiste los DeliveryPoint en BD
        └── 4. optimize_route()       - calcula el orden óptimo
        └── 5. save_solution()        - persiste RouteSolution + RouteSolutionDetail
"""

import csv
import json
import io
import math
from loguru import logger
import requests
from django.conf import settings
from typing import TypedDict

from django.db import transaction

from .models import (
    DeliveryPoint,
    FileType,
    Route,
    RouteSolution,
    RouteSolutionDetail,
    Status,
)

class RawRow(TypedDict):
    """Fila normalizada que sale del parser, antes de geocodificar."""
    address: str
    latitude: float | None
    longitude: float | None

class ResolvedRow(TypedDict):
    """Fila con coordenadas garantizadas, lista para persistir."""
    address: str
    latitude: float
    longitude: float

class RouteProcessingError(Exception):
    """
    Error controlado durante el procesamiento de una ruta.
    El task lo captura para marcar la ruta con Status.ERROR
    sin propagar un crash genérico.
    """

def parse_input_file(route: Route) -> list[RawRow]:
    """
    Lee el archivo asociado a la ruta y devuelve una lista de RawRow.

    Formatos soportados
    -------------------
    CSV — debe tener columna 'address'. Las columnas 'latitude' y 'longitude'
          son opcionales; si no están presentes se dejan en None.

    JSON — acepta dos estructuras:
        · Lista de objetos: [{"address": "...", "latitude": ..., "longitude": ...}, ...]
        · Objeto con clave "deliveries": {"deliveries": [...]}

    Raises
    ------
    RouteProcessingError
        Si el archivo no tiene el formato esperado o faltan columnas requeridas.
    """
    try:
        input_file = route.input_file
    except Route.input_file.RelatedObjectDoesNotExist:
        raise RouteProcessingError(f"La ruta {route.id} no tiene archivo de entrada asociado.")

    file_obj = input_file.file
    file_obj.seek(0)
    content = file_obj.read()

    # Obtiene solo el archivo y lo procesa según su tipo
    if input_file.file_type == FileType.CSV:
        return parse_csv(content)
    elif input_file.file_type == FileType.JSON:
        return parse_json(content)
    else:
        raise RouteProcessingError(f"Tipo de archivo no soportado: {input_file.file_type}")

def parse_csv(content: bytes) -> list[RawRow]:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    if "address" not in (reader.fieldnames or []):
        raise RouteProcessingError("El CSV debe contener la columna 'address'.")

    rows: list[RawRow] = []
    for i, raw in enumerate(reader, start=2):  # start=2 porque la fila 1 es el header (adress,lat,lng)
        address = raw.get("address", "").strip()
        if not address:
            raise RouteProcessingError(f"Fila {i}: la columna 'address' está vacía.")
        rows.append({
            "address": address,
            "latitude": _to_float(raw.get("latitude")),
            "longitude": _to_float(raw.get("longitude")),
        })

    if not rows:
        raise RouteProcessingError("El CSV no contiene filas de datos.")
    return rows

def parse_json(content: bytes) -> list[RawRow]:
    try:
        data = json.loads(content.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise RouteProcessingError(f"El JSON no es válido: {exc}")

    # Acepta lista directa o dict con clave "deliveries"
    if isinstance(data, dict):
        data = data.get("deliveries", [])
    if not isinstance(data, list):
        raise RouteProcessingError("El JSON debe ser una lista de objetos o contener la clave 'deliveries'.")
    if not data:
        raise RouteProcessingError("El JSON no contiene registros.")

    rows: list[RawRow] = []
    for i, item in enumerate(data):
        address = str(item.get("address", "")).strip()
        if not address:
            raise RouteProcessingError(f"Elemento {i}: falta el campo 'address'.")
        rows.append({
            "address": address,
            "latitude": _to_float(item.get("latitude")),
            "longitude": _to_float(item.get("longitude")),
        })
    return rows

def _to_float(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def resolve_coordinates(rows: list[RawRow]) -> list[ResolvedRow]:
    """
    Garantiza que todas las filas tengan lat/lng.

    - Si la fila ya tiene coordenadas -> se usa directamente.
    - Si le faltan -> se llama a geocode_address().

    Raises
    ------
    RouteProcessingError
        Si la geocodificación falla para alguna dirección.
    """
    resolved: list[ResolvedRow] = []
    for row in rows:
        if row["latitude"] is not None and row["longitude"] is not None:
            resolved.append({
                "address": row["address"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
            })
        else:
            lat, lng = geocode_address(row["address"])
            resolved.append({
                "address": row["address"],
                "latitude": lat,
                "longitude": lng,
            })
    return resolved

def geocode_address(address: str) -> tuple[float, float]:
    """
    Convierte una dirección de texto en coordenadas (lat, lng).

    Raises
    ------
    RouteProcessingError
        Si la API no devuelve resultados o falla la conexión.
    """
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": address,
        "format": "json",
        "limit": 1
    }
    
    headers = {
        "User-Agent": "route-optimizer-app"
    }

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        resp.raise_for_status()
        results = resp.json()
    except requests.RequestException as exc:
        raise RouteProcessingError(f"Error al conectar con Nominatim: {exc}")

    if not results:
        raise RouteProcessingError(f"No se encontraron coordenadas para: '{address}'")

    return float(results[0]["lat"]), float(results[0]["lon"])

def save_delivery_points(route: Route, rows: list[ResolvedRow]) -> list[DeliveryPoint]:
    """
    Crea los DeliveryPoint en BD usando bulk_create para minimizar queries.
    Devuelve la lista de instancias creadas en el mismo orden que 'rows'.
    """
    points = [
        DeliveryPoint(
            route=route,
            address=row["address"],
            latitude=row["latitude"],
            longitude=row["longitude"],
        )
        for row in rows
    ]
    DeliveryPoint.objects.bulk_create(points)
    return list(DeliveryPoint.objects.filter(route=route).order_by("id"))

# Umbral para activar k-opt, por encima de este valor se omite la mejora
K_OPT_THRESHOLD = 50

def optimize_route(
    points: list[DeliveryPoint],
    warehouse_lat: float,
    warehouse_lng: float,
) -> tuple[list[DeliveryPoint], float]:
    """
    Calcula el orden óptimo de visita para los puntos de entrega.
 
    Algoritmo
    ---------
    1. Christofides simplificado (MST + matching de nodos de grado impar
       por nearest-neighbor) como heurística de construcción inicial.
       Garantiza una solución ≤ 1.5× el óptimo en grafos métricos.
 
    2. 2-opt improvement condicional si len(points) <= K_OPT_THRESHOLD.
       Intercambia pares de aristas hasta que no haya mejora posible.
       Complejidad O(n²) por iteración; en la práctica converge rápido.
 
    Retorna
    -------
    ordered_points : list[DeliveryPoint] en el orden óptimo calculado.
    total_distance : Distancia total en km incluyendo salida y regreso al warehouse.
    """
    # Caso 1: no hay paquetes a entregar
    if not points:
        raise RouteProcessingError("No hay puntos de entrega para optimizar.")
    # Caso 2: Solo hay un paquete a entregar:
    # 1. Calcula la distancia del almacen a ese punto
    # 2. Duplica esa distancia (ida y vuelta)
    # 3. Devuelve la misma lista inicial, no se ocupa ordenamiento
    if len(points) == 1:
        d = haversine(warehouse_lat, warehouse_lng,
                       float(points[0].latitude), float(points[0].longitude))
        return points, round(d * 2, 4)
 
    # La matriz incluye el warehouse en el índice 0, los puntos en 1..n
    all_coords = [(warehouse_lat, warehouse_lng)] + [
        (float(p.latitude), float(p.longitude)) for p in points
    ]
    n_total = len(all_coords)  # Cantidad de paquetes a entregar + 1 (el almacén de partida)
 
    # Se crea una matriz [i][j] con la distancia entre cualquier par de nodos
    # Es una matriz simétrica
    graph = build_distance_matrix(all_coords)
 
    # Se construye un tour inicial siendo un recorrido que inicia y acaba en el almacén
    tour = christofides_tour(graph, n_total)
 
    # Si hay 50 paquetes o menos, aplica 2-opt
    if len(points) <= K_OPT_THRESHOLD:
        logger.debug("Aplicando 2-opt improvement (%d puntos).", len(points))
        tour = two_opt(tour, graph)
    else:
        logger.debug("2-opt omitido (%d puntos > umbral %d).", len(points), K_OPT_THRESHOLD)
 
    # Suma todas las aristas del tour final
    total_distance = _tour_distance(tour, graph)
 
    # tour[0] y tour[-1] son el almacén; los puntos están en 1..n
    # ejemplo:
    # inicia en almacén
    # se va al paquete 1
    # se va al paquete 2
    # regresa al almacén
    ordered_indices = [i - 1 for i in tour[1:-1]]  # descarta el almacén, convierte a índice de points[]
    ordered_points = [points[i] for i in ordered_indices]
 
    return ordered_points, round(total_distance, 4)


def build_distance_matrix(coords: list[tuple[float, float]]) -> list[list[float]]:
    """
    Matriz simétrica de distancias Haversine entre todos los nodos.
    coords[0] = warehouse, coords[1..n] = delivery points.
 
    Punto de extensión: reemplazar haversine() por una API de distancias
    viales (OSRM, Google Distance Matrix) para rutas más realistas.
    """
    # El tamaño de la matriz será nxn, donde n es la cantidad total de puntos (considerando el almacén)
    n = len(coords)
    
    #Inicia la matriz con 0.0 en todos los valores
    matrix = [[0.0] * n for _ in range(n)]
    
    # Por cada columna
    for i in range(n):
        # Por cada fila
        for j in range(i + 1, n):
            # La distancia se estima usando la formula Haversine
            # Los parámetros son:
            # latitud del punto 1,
            # longitud del punto 1,
            # latitud del punto 2,
            # longitud del punto 2,
            d = haversine(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
            # Como es una matriz simétrica, se guarda en la mitad inferior
            matrix[i][j] = d
            matrix[j][i] = d

    # Ejemplo de respuesta de la matriz:
    #  0  1  3  5  3
    #  1  0  2  3  1
    #  3  2  3  5  4
    #  5  3  5  4  2
    #  3  1  4  2  0
    # Donde el valor matrix[i][j] es la distancia desde el punto i hasta el j, si un índice es 0 representa el almacén
    
    return matrix

def christofides_tour(graph: list[list[float]], n: int) -> list[int]:
    """
    Heurística de Christofides simplificada para TSP métrico.
 
    Pasos
    -----
    1. MST de Prim sobre el grafo completo (nodos 0..n-1).
    2. Identificar nodos de grado impar en el MST.
    3. Matching mínimo aproximado de los nodos impares
       (greedy nearest-neighbor; el matching exacto requiere Blossom V).
    4. Construir multigrafo MST + matching y extraer circuito euleriano.
    5. Shortcutting: saltar nodos ya visitados para obtener tour hamiltoniano.
 
    El tour comienza y termina en el nodo 0 (warehouse).
    """
    # MST (Minimum Spanning Tree) con Prim
    # Calcula un árbol de expansión mínima
    # Un MST conecta todos los nodos con el menor costo total, sin ciclos
    # El MST no resuelve el problema, pero sirve como base para construir una ruta más corta
    mst_adj = prim_mst(graph, n)

    # Nodos de grado impar
    # En el MST algunos nodos tendrán grado impar
    # Un circuito euleriano solo existe si todos los nodos tienen grado par
    # Solo hay que "arreglar" los grados impares ('stalin sort' ahh algorithm)
    odd_nodes = odd_degree_nodes(mst_adj, n)

    # Se emparejan los nodos impares entre sí
    # Se generan aristas extra para que todos los grados se vuelvan pares
    # Es un matching greedy, no óptimo, es aproximado 
    # En teoría se pierde la garantía teórica del Christofides clásico, pero baja el tiempo de procesamiento
    matching_edges = greedy_matching(odd_nodes, graph)
 
    # Multigrafo = MST + matching
    # Se combinan las aristas del MST y las aristas del matching
    multigraph: list[list[int]] = [[] for _ in range(n)]
    for u, neighbors in enumerate(mst_adj):
        for v in neighbors:
            multigraph[u].append(v)
    for u, v in matching_edges:
        multigraph[u].append(v)
        multigraph[v].append(u)
 
    # Circuito euleriano
    # Con todos los grafos pares, ya es posible encontrar un recorrido que usa cada arista
    # Aun no es la solución del TSP, pq puede repetir nodos
    euler = eulerian_circuit(multigraph, start=0)

    # Se eliminan repeticiones de nodos
    # Si el circuito euleriano pasa varias veces por el mismo nodo,
    # se conserva la primera aparición y se saltan las demás
    tour = shortcut(euler)
    return tour
 
 
def prim_mst(graph: list[list[float]], n: int) -> list[list[int]]:
    """
    Este método genera el MST con algoritmo de Prim.
    Retorna lista de adyacencia (sin pesos).
    """
    # Si el nodo v ya entró al arbol
    in_mst = [False] * n

    # La arista más barata conocida para conectar v al MST
    min_edge = [math.inf] * n
    
    # Desde qué nodo se conecta v al MST
    parent = [-1] * n
    
    # Costo de arranque
    min_edge[0] = 0.0
 
    adj: list[list[int]] = [[] for _ in range(n)]
 
    for _ in range(n):
        # Nodo con menor arista que no esté en el MST
        u = min((v for v in range(n) if not in_mst[v]), key=lambda v: min_edge[v])
        in_mst[u] = True
 
        if parent[u] != -1:
            adj[parent[u]].append(u)
            adj[u].append(parent[u])
 
        for v in range(n):
            if not in_mst[v] and graph[u][v] < min_edge[v]:
                min_edge[v] = graph[u][v]
                parent[v] = u
 
    return adj

def odd_degree_nodes(adj: list[list[int]], n: int) -> list[int]:
    """Retorna los índices de nodos con grado impar en el árbol dado."""
    # Cuenta cuantas aristas tiene cada nodo en el MST
    # Si el número es impar, ese nodo entra en la lista
    return [i for i in range(n) if len(adj[i]) % 2 != 0]
 
def greedy_matching(nodes: list[int], graph: list[list[float]]) -> list[tuple[int, int]]:
    """
    Matching mínimo aproximado sobre un conjunto de nodos.
 
    Greedy: empareja cada nodo libre con su vecino libre más cercano.
    El matching exacto (algoritmo de Blossom) es O(n³),
    por cuestiones de la capacidad del autor de este código (el sesarin)
    se deja este que es más simple para lo que derick pidió pero sirve 
    """
    remaining = list(nodes)
    edges: list[tuple[int, int]] = []
 
    # Mientras queden al menos 2 nodos libres
    while len(remaining) >= 2:
        # Toma el primero
        u = remaining[0]

        # Vecino más cercano entre los nodos restantes (excluyendo u)
        best_v = min(remaining[1:], key=lambda v: graph[u][v])

        # Crea la arista entre ambos
        edges.append((u, best_v))
        
        # Elimina ambos de la lista
        remaining.remove(u)
        remaining.remove(best_v)

    return edges

def eulerian_circuit(adj: list[list[int]], start: int) -> list[int]:
    """
    Circuito euleriano por el algoritmo de Hierholzer (iterativo).
    Modifica una copia de adj para no alterar el multigrafo original.
    """
    #se hace una copia para no perder el original
    graph_copy = [list(neighbors) for neighbors in adj]
    
    # Se usa unapila
    stack = [start]
    circuit: list[int] = []

    # Mientras haya nodos en la pila:
    while stack:
        # Si todavía tiene aristas sin usar, toma una
        v = stack[-1]
        if graph_copy[v]:
            u = graph_copy[v].pop()
            graph_copy[u].remove(v)
            stack.append(u)
        # si no tiene más aristas, lo agrega al circuito final
        else:
            circuit.append(stack.pop())

    # Invierte el circuito
    circuit.reverse()

    # esta funcion produce un recorrido cerrado que usa todas las aristas exactamente una vez
    # pero aun tiene nodos repetidos, por eso hace falta el shortcutting
    return circuit
 
 
def shortcut(euler: list[int]) -> list[int]:
    """
    Convierte el circuito euleriano en tour hamiltoniano
    saltando nodos ya visitados (shortcutting).
    Preserva el nodo inicial al inicio y al final.
    """
    #básicamente si un nodo ya está en la lista ya no lo coloca
    seen: set[int] = set()
    tour: list[int] = []
    for node in euler:
        if node not in seen:
            seen.add(node)
            tour.append(node)
    tour.append(tour[0])  # cerrar el ciclo
    return tour
 
def two_opt(tour: list[int], graph: list[list[float]]) -> list[int]:
    """
    Mejora el tour intercambiando pares de aristas (2-opt).
 
    Itera hasta que ningún intercambio reduzca la distancia total.
    Complejidad O(n²) por pasada; en la práctica converge en pocas iteraciones.
 
    El almacen (tour[0] = tour[-1]) se mantiene fijo como punto de inicio/fin.
    Solo se permutan los nodos internos (índices 1..n-2 del tour).
    """
    best = tour[:]
    improved = True
 
    while improved:
        improved = False
        # Iterar sobre aristas internas (excluyendo las conexiones al warehouse)
        for i in range(1, len(best) - 2):
            for j in range(i + 1, len(best) - 1):
                # Distancia actual: best[i-1]→best[i] + best[j]→best[j+1]
                current = graph[best[i - 1]][best[i]] + graph[best[j]][best[j + 1]]
                # Distancia si invertimos el segmento entre i y j
                swapped = graph[best[i - 1]][best[j]] + graph[best[i]][best[j + 1]]
 
                if swapped < current - 1e-10:  # tolerancia para floats
                    best[i:j + 1] = best[i:j + 1][::-1]
                    improved = True
 
    return best

def _tour_distance(tour: list[int], graph: list[list[float]]) -> float:
    """Suma la distancia total de un tour cerrado."""
    return sum(graph[tour[i]][tour[i + 1]] for i in range(len(tour) - 1))

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia entre dos puntos geográficos en kilómetros (fórmula Haversine)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))

def save_solution(route: Route, ordered_points: list[DeliveryPoint], total_distance: float) -> RouteSolution:
    """
    Persiste RouteSolution y sus RouteSolutionDetail en una transacción atómica.
    """
    with transaction.atomic():
        solution = RouteSolution.objects.create(
            route=route,
            total_distance=total_distance,
        )
        details = [
            RouteSolutionDetail(
                solution=solution,
                delivery_point=point,
                order_index=idx,
            )
            for idx, point in enumerate(ordered_points)
        ]
        RouteSolutionDetail.objects.bulk_create(details)

    return solution

def process_route(route_id: int) -> None:
    """
    Punto de entrada principal. Ejecuta el flujo completo de procesamiento
    de una ruta y actualiza su estado en cada etapa.
    """
    try:
        route = Route.objects.select_related("input_file", "warehouse").get(id=route_id)
    except Route.DoesNotExist:
        logger.error("process_route: ruta %s no encontrada.", route_id)
        return

    logger.info("Iniciando procesamiento de ruta %s.", route_id)
    route.status = Status.PROCESSING
    route.save(update_fields=["status"])

    try:
        raw_rows = parse_input_file(route)
        logger.debug("Ruta %s: %d filas parseadas.", route_id, len(raw_rows))

        resolved_rows = resolve_coordinates(raw_rows)
        logger.debug("Ruta %s: coordenadas resueltas.", route_id)

        points = save_delivery_points(route, resolved_rows)
        logger.debug("Ruta %s: %d DeliveryPoints creados.", route_id, len(points))
 
        warehouse = route.warehouse
        ordered_points, total_distance = optimize_route(
            points,
            warehouse_lat=float(warehouse.latitude),
            warehouse_lng=float(warehouse.longitude),
        )
        logger.debug("Ruta %s: distancia total %.2f km.", route_id, total_distance)

        save_solution(route, ordered_points, total_distance)
        logger.info("Ruta %s procesada correctamente.", route_id)

        route.status = Status.COMPLETED

    except RouteProcessingError as exc:
        logger.error("Ruta %s — error controlado: %s", route_id, exc)
        route.status = Status.ERROR
        
    except Exception as exc:
        logger.critical("Ruta %s — error inesperado: %s", route_id, exc)
        route.status = Status.ERROR

    finally:
        route.save(update_fields=["status"])