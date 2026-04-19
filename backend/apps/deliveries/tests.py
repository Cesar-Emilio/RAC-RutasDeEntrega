"""
Tests para la aplicación Deliveries.

Cubre:
  - Utilidades de distancia (Haversine, matriz)
  - Algoritmo de Christofides simplificado (MST Prim, nodos impares,
    greedy matching, circuito euleriano, shortcutting)
  - optimize_route (casos borde + propiedades del tour)
  - Parseo de archivos CSV / JSON
  - Resolución de coordenadas (geocoding mock)
  - Persistencia: save_delivery_points, save_solution
  - Flujo completo: process_route
"""

import io
import json
import csv
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from apps.deliveries.models import (
    DeliveryPoint,
    FileType,
    Route,
    RouteInputFile,
    RouteSolution,
    RouteSolutionDetail,
    Status,
)
from apps.deliveries.services import (
    RouteProcessingError,
    build_distance_matrix,
    christofides_tour,
    eulerian_circuit,
    haversine,
    odd_degree_nodes,
    parse_csv,
    parse_json,
    prim_mst,
    shortcut,
    _to_float,
    _tour_distance,
    two_opt,
    optimize_route,
    parse_input_file,
    process_route,
    resolve_coordinates,
    save_delivery_points,
    save_solution,
)


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _make_csv_bytes(rows: list[dict], fieldnames: list[str] | None = None) -> bytes:
    """Genera contenido CSV en bytes a partir de una lista de dicts."""
    if fieldnames is None:
        fieldnames = list(rows[0].keys())
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue().encode("utf-8")


def _make_json_bytes(data) -> bytes:
    return json.dumps(data).encode("utf-8")


def _build_point(route, lat, lng, address="addr"):
    """Crea un DeliveryPoint en BD."""
    return DeliveryPoint.objects.create(
        route=route, latitude=lat, longitude=lng, address=address,
    )


def _create_warehouse(company):
    """Crea un Warehouse válido para pruebas (cumple CheckConstraints)."""
    from apps.warehouses.models import Warehouse
    return Warehouse.objects.create(
        company=company,
        name="Almacen Test",
        address="Calle Falsa 12345",
        city="Cuernavaca",
        state="Morelos",
        postal_code="62000",
        latitude=Decimal("18.920000"),
        longitude=Decimal("-99.230000"),
    )


# ──────────────────────────────────────────────
# 1. Haversine y utilidades de distancia
# ──────────────────────────────────────────────

class HaversineTests(TestCase):
    """Pruebas de la fórmula Haversine."""

    def test_misma_coordenada_es_cero(self):
        self.assertAlmostEqual(haversine(19.4326, -99.1332, 19.4326, -99.1332), 0.0)

    def test_distancia_conocida_cdmx_gdl(self):
        """CDMX → Guadalajara ≈ 460 km en línea recta."""
        d = haversine(19.4326, -99.1332, 20.6597, -103.3496)
        self.assertAlmostEqual(d, 460, delta=30)  # tolerancia de 30 km

    def test_simetria(self):
        d1 = haversine(19.4326, -99.1332, 20.6597, -103.3496)
        d2 = haversine(20.6597, -103.3496, 19.4326, -99.1332)
        self.assertAlmostEqual(d1, d2, places=6)

    def test_distancia_siempre_positiva(self):
        d = haversine(0.0, 0.0, 1.0, 1.0)
        self.assertGreater(d, 0)


class ToFloatTests(TestCase):
    """Pruebas para _to_float."""

    def test_float_valido(self):
        self.assertEqual(_to_float("19.4326"), 19.4326)

    def test_entero_valido(self):
        self.assertEqual(_to_float("42"), 42.0)

    def test_none_devuelve_none(self):
        self.assertIsNone(_to_float(None))

    def test_cadena_vacia_devuelve_none(self):
        self.assertIsNone(_to_float(""))

    def test_texto_invalido_devuelve_none(self):
        self.assertIsNone(_to_float("no-es-numero"))


# ──────────────────────────────────────────────
# 2. Matriz de distancias
# ──────────────────────────────────────────────

class DistanceMatrixTests(TestCase):
    """Pruebas para build_distance_matrix."""

    def test_diagonal_es_cero(self):
        coords = [(0, 0), (1, 1), (2, 2)]
        m = build_distance_matrix(coords)
        for i in range(len(coords)):
            self.assertEqual(m[i][i], 0.0)

    def test_simetria_de_la_matriz(self):
        coords = [(19.43, -99.13), (20.66, -103.35), (25.67, -100.31)]
        m = build_distance_matrix(coords)
        n = len(coords)
        for i in range(n):
            for j in range(n):
                self.assertAlmostEqual(m[i][j], m[j][i], places=6)

    def test_tamano_correcto(self):
        coords = [(0, 0), (1, 1)]
        m = build_distance_matrix(coords)
        self.assertEqual(len(m), 2)
        self.assertEqual(len(m[0]), 2)

    def test_valores_positivos_fuera_diagonal(self):
        coords = [(0, 0), (10, 10)]
        m = build_distance_matrix(coords)
        self.assertGreater(m[0][1], 0)

    def test_un_solo_punto(self):
        m = build_distance_matrix([(0, 0)])
        self.assertEqual(m, [[0.0]])


# ──────────────────────────────────────────────
# 3. MST de Prim
# ──────────────────────────────────────────────

class PrimMSTTests(TestCase):
    """Pruebas para prim_mst."""

    def test_todos_los_nodos_conectados(self):
        """El MST debe tener exactamente n-1 aristas y conectar todos los nodos."""
        coords = [(0, 0), (1, 0), (0, 1), (1, 1)]
        graph = build_distance_matrix(coords)
        adj = prim_mst(graph, 4)
        total_edges = sum(len(neighbors) for neighbors in adj) // 2
        self.assertEqual(total_edges, 3)  # n-1

    def test_tres_nodos(self):
        coords = [(0, 0), (1, 0), (2, 0)]
        graph = build_distance_matrix(coords)
        adj = prim_mst(graph, 3)
        total_edges = sum(len(neighbors) for neighbors in adj) // 2
        self.assertEqual(total_edges, 2)

    def test_dos_nodos(self):
        coords = [(0, 0), (5, 5)]
        graph = build_distance_matrix(coords)
        adj = prim_mst(graph, 2)
        self.assertIn(1, adj[0])
        self.assertIn(0, adj[1])


# ──────────────────────────────────────────────
# 4. Nodos de grado impar
# ──────────────────────────────────────────────

class OddDegreeNodesTests(TestCase):
    def test_cantidad_par_de_nodos_impares(self):
        """Siempre debe haber una cantidad par de nodos de grado impar."""
        coords = [(0, 0), (1, 0), (0, 1), (1, 1), (0.5, 0.5)]
        graph = build_distance_matrix(coords)
        adj = prim_mst(graph, 5)
        odd = odd_degree_nodes(adj, 5)
        self.assertEqual(len(odd) % 2, 0)

    def test_cadena_lineal(self):
        """Una cadena A—B—C tiene nodos extremos impares (grado 1)."""
        adj = [[1], [0, 2], [1]]  # A-B-C
        odd = odd_degree_nodes(adj, 3)
        self.assertIn(0, odd)
        self.assertIn(2, odd)
        self.assertNotIn(1, odd)
        
        
# ──────────────────────────────────────────────
# 6. Circuito euleriano (Hierholzer)
# ──────────────────────────────────────────────

class EulerianCircuitTests(TestCase):
    def test_triangulo(self):
        """Grafo triángulo: 0-1, 1-2, 2-0."""
        adj = [[1, 2], [0, 2], [1, 0]]
        circuit = eulerian_circuit(adj, start=0)
        self.assertEqual(circuit[0], 0)
        self.assertEqual(circuit[-1], 0)
        # Usa cada arista exactamente una vez → 3 aristas + cierre = 4 nodos
        self.assertEqual(len(circuit), 4)

    def test_cuadrado_con_aristas_dobles(self):
        """Multigrafo: cada arista duplicada → todos grado par."""
        adj = [[1, 1], [0, 0]]
        circuit = eulerian_circuit(adj, start=0)
        self.assertEqual(circuit[0], 0)
        self.assertEqual(circuit[-1], 0)


# ──────────────────────────────────────────────
# 7. Shortcutting
# ──────────────────────────────────────────────

class ShortcutTests(TestCase):
    def test_elimina_repetidos(self):
        euler = [0, 1, 2, 1, 3, 0]
        tour = shortcut(euler)
        # Debe contener cada nodo una vez (excepto el cierre) + cierre
        self.assertEqual(tour[0], tour[-1])
        interior = tour[:-1]
        self.assertEqual(len(interior), len(set(interior)))

    def test_sin_repetidos(self):
        euler = [0, 1, 2, 3, 0]
        tour = shortcut(euler)
        self.assertEqual(tour, [0, 1, 2, 3, 0])

    def test_cierre_del_tour(self):
        euler = [0, 1, 2]
        tour = shortcut(euler)
        self.assertEqual(tour[-1], tour[0])


# ──────────────────────────────────────────────
# 8. Tour de Christofides completo
# ──────────────────────────────────────────────

class ChristofidesTests(TestCase):
    def test_tour_hamiltoniano_valido(self):
        """El tour debe visitar cada nodo exactamente una vez y cerrar en 0."""
        coords = [(0, 0), (1, 0), (0, 1), (1, 1)]
        graph = build_distance_matrix(coords)
        tour = christofides_tour(graph, 4)

        self.assertEqual(tour[0], 0)
        self.assertEqual(tour[-1], 0)
        interior = tour[1:-1]
        self.assertEqual(sorted(interior), [1, 2, 3])

    def test_dos_nodos(self):
        coords = [(0, 0), (1, 0)]
        graph = build_distance_matrix(coords)
        tour = christofides_tour(graph, 2)
        self.assertEqual(tour[0], 0)
        self.assertEqual(tour[-1], 0)
        self.assertIn(1, tour)

    def test_cinco_nodos(self):
        coords = [(0, 0), (1, 0), (2, 0), (1, 1), (0, 1)]
        graph = build_distance_matrix(coords)
        tour = christofides_tour(graph, 5)
        self.assertEqual(tour[0], 0)
        self.assertEqual(tour[-1], 0)
        self.assertEqual(sorted(tour[1:-1]), [1, 2, 3, 4])


# ──────────────────────────────────────────────
# 9. 2-opt improvement
# ──────────────────────────────────────────────

class TwoOptTests(TestCase):
    def test_no_empeora(self):
        """2-opt nunca debe producir un tour peor."""
        coords = [(0, 0), (3, 0), (1, 1), (2, 1)]
        graph = build_distance_matrix(coords)
        initial = [0, 1, 2, 3, 0]
        improved = two_opt(initial, graph)
        self.assertLessEqual(
            _tour_distance(improved, graph),
            _tour_distance(initial, graph) + 1e-9,
        )

    def test_mantiene_almacen_fijo(self):
        coords = [(0, 0), (1, 0), (0, 1), (1, 1)]
        graph = build_distance_matrix(coords)
        tour = [0, 1, 2, 3, 0]
        improved = two_opt(tour, graph)
        self.assertEqual(improved[0], 0)
        self.assertEqual(improved[-1], 0)

    def test_tour_optimo_no_cambia(self):
        """Un tour que ya es óptimo no debería sufrir cambios."""
        coords = [(0, 0), (1, 0), (1, 1), (0, 1)]  # cuadrado
        graph = build_distance_matrix(coords)
        tour = [0, 1, 2, 3, 0]
        improved = two_opt(tour, graph)
        # La distancia debe ser igual
        self.assertAlmostEqual(
            _tour_distance(improved, graph),
            _tour_distance(tour, graph),
            places=6,
        )

    def test_preserva_todos_los_nodos(self):
        coords = [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)]
        graph = build_distance_matrix(coords)
        tour = [0, 3, 1, 4, 2, 0]  # orden subóptimo
        improved = two_opt(tour, graph)
        self.assertEqual(sorted(improved[1:-1]), [1, 2, 3, 4])


class TourDistanceTests(TestCase):
    def test_distancia_correcta(self):
        graph = [
            [0, 10, 20],
            [10, 0, 15],
            [20, 15, 0],
        ]
        tour = [0, 1, 2, 0]
        d = _tour_distance(tour, graph)
        self.assertAlmostEqual(d, 10 + 15 + 20, places=6)


# ──────────────────────────────────────────────
# 10. optimize_route (integración con BD)
# ──────────────────────────────────────────────

class OptimizeRouteTests(TestCase):
    """Pruebas para optimize_route usando objetos DeliveryPoint mocked."""

    def test_un_solo_punto(self):
        """Con un solo punto, la distancia es 2× la distancia al warehouse."""
        p = MagicMock(spec=DeliveryPoint)
        p.latitude = Decimal("19.4326")
        p.longitude = Decimal("-99.1332")

        ordered, dist = optimize_route([p], 19.0, -99.0)
        self.assertEqual(len(ordered), 1)
        expected = haversine(19.0, -99.0, 19.4326, -99.1332) * 2
        self.assertAlmostEqual(dist, round(expected, 4), places=4)

    def test_sin_puntos_lanza_error(self):
        with self.assertRaises(RouteProcessingError):
            optimize_route([], 0.0, 0.0)

    def test_tour_valido_multiples_puntos(self):
        """Con n puntos, devuelve n puntos en un orden válido."""
        points = []
        for i in range(5):
            p = MagicMock(spec=DeliveryPoint)
            p.latitude = Decimal(str(19.0 + i * 0.1))
            p.longitude = Decimal(str(-99.0 - i * 0.1))
            points.append(p)

        ordered, dist = optimize_route(points, 19.0, -99.0)
        self.assertEqual(len(ordered), 5)
        self.assertGreater(dist, 0)

    def test_distancia_total_positiva(self):
        points = []
        for i in range(3):
            p = MagicMock(spec=DeliveryPoint)
            p.latitude = Decimal(str(20.0 + i))
            p.longitude = Decimal(str(-100.0 + i))
            points.append(p)

        _, dist = optimize_route(points, 19.0, -99.0)
        self.assertGreater(dist, 0)

    def test_2opt_mejora_tour_cruzado(self):
        """Verifica que 2-opt mejora un tour con cruces evidentes."""
        # Cuadrado: 0=(0,0), 1=(1,0), 2=(1,1), 3=(0,1)
        # Tour cruzado: 0 → 2 → 1 → 3 → 0 (las aristas se cruzan)
        coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
        graph = build_distance_matrix(coords)
        crossed_tour = [0, 2, 1, 3, 0]
        optimal_tour = two_opt(crossed_tour, graph)
        self.assertLess(
            _tour_distance(optimal_tour, graph),
            _tour_distance(crossed_tour, graph),
        )


# ──────────────────────────────────────────────
# 11. Parseo de CSV
# ──────────────────────────────────────────────

class ParseCSVTests(TestCase):
    def test_csv_valido_con_coordenadas(self):
        content = _make_csv_bytes([
            {"address": "Calle A", "latitude": "19.43", "longitude": "-99.13"},
            {"address": "Calle B", "latitude": "20.66", "longitude": "-103.35"},
        ])
        rows = parse_csv(content)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["address"], "Calle A")
        self.assertAlmostEqual(rows[0]["latitude"], 19.43)

    def test_csv_sin_coordenadas(self):
        content = _make_csv_bytes(
            [{"address": "Calle A"}],
            fieldnames=["address"],
        )
        rows = parse_csv(content)
        self.assertEqual(len(rows), 1)
        self.assertIsNone(rows[0]["latitude"])
        self.assertIsNone(rows[0]["longitude"])

    def test_csv_sin_columna_address_lanza_error(self):
        content = _make_csv_bytes(
            [{"nombre": "X"}],
            fieldnames=["nombre"],
        )
        with self.assertRaises(RouteProcessingError):
            parse_csv(content)

    def test_csv_vacio_lanza_error(self):
        content = b"address,latitude,longitude\r\n"
        with self.assertRaises(RouteProcessingError):
            parse_csv(content)

    def test_csv_address_vacia_lanza_error(self):
        content = _make_csv_bytes(
            [{"address": "", "latitude": "19", "longitude": "-99"}],
        )
        with self.assertRaises(RouteProcessingError):
            parse_csv(content)

    def test_csv_coordenadas_parciales(self):
        """Si solo viene latitude sin longitude, longitude queda None."""
        content = _make_csv_bytes([
            {"address": "Calle A", "latitude": "19.43", "longitude": ""},
        ])
        rows = parse_csv(content)
        self.assertAlmostEqual(rows[0]["latitude"], 19.43)
        self.assertIsNone(rows[0]["longitude"])


# ──────────────────────────────────────────────
# 12. Parseo de JSON
# ──────────────────────────────────────────────

class ParseJSONTests(TestCase):
    def test_json_lista_directa(self):
        data = [
            {"address": "Calle A", "latitude": 19.43, "longitude": -99.13},
        ]
        rows = parse_json(_make_json_bytes(data))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["address"], "Calle A")

    def test_json_con_clave_deliveries(self):
        data = {
            "deliveries": [
                {"address": "Calle B", "latitude": 20.0, "longitude": -100.0},
            ]
        }
        rows = parse_json(_make_json_bytes(data))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["address"], "Calle B")

    def test_json_invalido_lanza_error(self):
        with self.assertRaises(RouteProcessingError):
            parse_json(b"{esto no es json}")

    def test_json_no_es_lista_lanza_error(self):
        with self.assertRaises(RouteProcessingError):
            parse_json(_make_json_bytes({"key": "value"}))

    def test_json_vacio_lanza_error(self):
        with self.assertRaises(RouteProcessingError):
            parse_json(_make_json_bytes([]))

    def test_json_sin_address_lanza_error(self):
        data = [{"latitude": 19.0, "longitude": -99.0}]
        with self.assertRaises(RouteProcessingError):
            parse_json(_make_json_bytes(data))

    def test_json_sin_coordenadas(self):
        data = [{"address": "Calle C"}]
        rows = parse_json(_make_json_bytes(data))
        self.assertIsNone(rows[0]["latitude"])
        self.assertIsNone(rows[0]["longitude"])


# ──────────────────────────────────────────────
# 13. parse_input_file (integración)
# ──────────────────────────────────────────────

class ParseInputFileTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.companies.models import Company
        cls.company = Company.objects.create(
            name="Test Co", email="test@co.com", rfc="XAXX010101000",
        )
        cls.warehouse = _create_warehouse(cls.company)

    def _create_route_with_file(self, content: bytes, file_type: str):
        route = Route.objects.create(
            company=self.company,
            warehouse=self.warehouse,
            delivery_count=1,
        )
        uploaded = SimpleUploadedFile("test.dat", content)
        RouteInputFile.objects.create(
            route=route, file=uploaded, file_type=file_type,
        )
        route.refresh_from_db()
        return route

    def test_parse_csv_file(self):
        content = _make_csv_bytes([
            {"address": "Addr1", "latitude": "19.0", "longitude": "-99.0"},
        ])
        route = self._create_route_with_file(content, FileType.CSV)
        rows = parse_input_file(route)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["address"], "Addr1")

    def test_parse_json_file(self):
        data = [{"address": "Addr2", "latitude": 20.0, "longitude": -100.0}]
        content = _make_json_bytes(data)
        route = self._create_route_with_file(content, FileType.JSON)
        rows = parse_input_file(route)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["address"], "Addr2")

    def test_ruta_sin_archivo_lanza_error(self):
        route = Route.objects.create(
            company=self.company,
            warehouse=self.warehouse,
            delivery_count=0,
        )
        with self.assertRaises(RouteProcessingError):
            parse_input_file(route)


# ──────────────────────────────────────────────
# 14. Resolución de coordenadas
# ──────────────────────────────────────────────

class ResolveCoordinatesTests(TestCase):
    def test_filas_con_coordenadas_no_geocodifican(self):
        rows = [{"address": "A", "latitude": 19.0, "longitude": -99.0}]
        with patch("apps.deliveries.services.geocode_address") as mock_geo:
            result = resolve_coordinates(rows)
            mock_geo.assert_not_called()
        self.assertEqual(result[0]["latitude"], 19.0)

    @patch("apps.deliveries.services.geocode_address", return_value=(19.5, -99.5))
    def test_filas_sin_coordenadas_geocodifican(self, mock_geo):
        rows = [{"address": "B", "latitude": None, "longitude": None}]
        result = resolve_coordinates(rows)
        mock_geo.assert_called_once_with("B")
        self.assertEqual(result[0]["latitude"], 19.5)
        self.assertEqual(result[0]["longitude"], -99.5)

    @patch("apps.deliveries.services.geocode_address", return_value=(20.0, -100.0))
    def test_mezcla_con_y_sin_coordenadas(self, mock_geo):
        rows = [
            {"address": "A", "latitude": 19.0, "longitude": -99.0},
            {"address": "B", "latitude": None, "longitude": None},
        ]
        result = resolve_coordinates(rows)
        self.assertEqual(len(result), 2)
        mock_geo.assert_called_once_with("B")

    @patch("apps.deliveries.services.geocode_address")
    def test_geocodificacion_fallida_lanza_error(self, mock_geo):
        mock_geo.side_effect = RouteProcessingError("No encontrado")
        rows = [{"address": "X", "latitude": None, "longitude": None}]
        with self.assertRaises(RouteProcessingError):
            resolve_coordinates(rows)


# ──────────────────────────────────────────────
# 15. Persistencia — save_delivery_points
# ──────────────────────────────────────────────

class SaveDeliveryPointsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.companies.models import Company
        cls.company = Company.objects.create(
            name="Persist Co", email="persist@co.com", rfc="XAXX010101000",
        )
        cls.warehouse = _create_warehouse(cls.company)

    def test_crea_puntos_en_bd(self):
        route = Route.objects.create(
            company=self.company, warehouse=self.warehouse, delivery_count=2,
        )
        rows = [
            {"address": "P1", "latitude": 19.0, "longitude": -99.0},
            {"address": "P2", "latitude": 20.0, "longitude": -100.0},
        ]
        points = save_delivery_points(route, rows)
        self.assertEqual(len(points), 2)
        self.assertEqual(DeliveryPoint.objects.filter(route=route).count(), 2)

    def test_orden_preservado(self):
        route = Route.objects.create(
            company=self.company, warehouse=self.warehouse, delivery_count=3,
        )
        rows = [
            {"address": f"P{i}", "latitude": 19.0 + i, "longitude": -99.0 - i}
            for i in range(3)
        ]
        points = save_delivery_points(route, rows)
        for i, p in enumerate(points):
            self.assertEqual(p.address, f"P{i}")


# ──────────────────────────────────────────────
# 16. Persistencia — save_solution
# ──────────────────────────────────────────────

class SaveSolutionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.companies.models import Company
        cls.company = Company.objects.create(
            name="Sol Co", email="sol@co.com", rfc="XAXX010101000",
        )
        cls.warehouse = _create_warehouse(cls.company)

    def test_crea_solution_con_details(self):
        route = Route.objects.create(
            company=self.company, warehouse=self.warehouse, delivery_count=2,
        )
        p1 = DeliveryPoint.objects.create(
            route=route, address="A", latitude=19.0, longitude=-99.0,
        )
        p2 = DeliveryPoint.objects.create(
            route=route, address="B", latitude=20.0, longitude=-100.0,
        )
        solution = save_solution(route, [p1, p2], 123.456)

        self.assertIsNotNone(solution.pk)
        self.assertAlmostEqual(solution.total_distance, 123.456)
        self.assertEqual(RouteSolutionDetail.objects.filter(solution=solution).count(), 2)

    def test_order_index_correcto(self):
        route = Route.objects.create(
            company=self.company, warehouse=self.warehouse, delivery_count=2,
        )
        p1 = DeliveryPoint.objects.create(
            route=route, address="X", latitude=19.0, longitude=-99.0,
        )
        p2 = DeliveryPoint.objects.create(
            route=route, address="Y", latitude=20.0, longitude=-100.0,
        )
        solution = save_solution(route, [p2, p1], 50.0)
        details = list(
            RouteSolutionDetail.objects.filter(solution=solution).order_by("order_index")
        )
        self.assertEqual(details[0].delivery_point, p2)
        self.assertEqual(details[0].order_index, 0)
        self.assertEqual(details[1].delivery_point, p1)
        self.assertEqual(details[1].order_index, 1)


# ──────────────────────────────────────────────
# 17. Flujo completo — process_route
# ──────────────────────────────────────────────

class ProcessRouteTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.companies.models import Company
        cls.company = Company.objects.create(
            name="Flow Co", email="flow@co.com", rfc="XAXX010101000",
        )
        cls.warehouse = _create_warehouse(cls.company)

    def _create_full_route(self, content: bytes, file_type: str):
        """Crea Route con warehouse real y archivo adjunto."""
        route = Route.objects.create(
            company=self.company,
            warehouse=self.warehouse,
            delivery_count=2,
        )
        uploaded = SimpleUploadedFile("data.dat", content)
        RouteInputFile.objects.create(
            route=route, file=uploaded, file_type=file_type,
        )
        return route

    @patch("apps.deliveries.services.resolve_coordinates")
    def test_proceso_exitoso_csv(self, mock_resolve):
        """El flujo completo con CSV marca status=COMPLETED y crea solución."""
        content = _make_csv_bytes([
            {"address": "A", "latitude": "19.43", "longitude": "-99.13"},
            {"address": "B", "latitude": "20.66", "longitude": "-103.35"},
        ])
        route = self._create_full_route(content, FileType.CSV)

        mock_resolve.return_value = [
            {"address": "A", "latitude": 19.43, "longitude": -99.13},
            {"address": "B", "latitude": 20.66, "longitude": -103.35},
        ]

        process_route(route.id)

        route.refresh_from_db()
        self.assertEqual(route.status, Status.COMPLETED)
        self.assertTrue(RouteSolution.objects.filter(route=route).exists())

    def test_ruta_inexistente_no_lanza_error(self):
        """Si la ruta no existe, simplemente loguea y retorna sin crash."""
        process_route(999999)  # ID que no existe

    @patch("apps.deliveries.services.parse_input_file")
    def test_error_controlado_marca_status_error(self, mock_parse):
        """Un RouteProcessingError cambia el status a ERROR."""
        mock_parse.side_effect = RouteProcessingError("Archivo corrupto")

        route = Route.objects.create(
            company=self.company,
            warehouse=self.warehouse,
            delivery_count=0,
        )

        process_route(route.id)

        route.refresh_from_db()
        self.assertEqual(route.status, Status.ERROR)


# ──────────────────────────────────────────────
# 18. Propiedades algorítmicas del TSP
# ──────────────────────────────────────────────

class TSPPropertiesTests(TestCase):
    """
    Pruebas de propiedades generales que la solución TSP debe cumplir,
    independientemente del algoritmo usado.
    """

    def _make_mock_points(self, coords):
        """Crea lista de MagicMock imitando DeliveryPoints."""
        points = []
        for lat, lng in coords:
            p = MagicMock(spec=DeliveryPoint)
            p.latitude = Decimal(str(lat))
            p.longitude = Decimal(str(lng))
            points.append(p)
        return points

    def test_todos_los_puntos_aparecen_en_solucion(self):
        coords = [(19.0 + i * 0.1, -99.0 + i * 0.1) for i in range(10)]
        points = self._make_mock_points(coords)
        ordered, _ = optimize_route(points, 18.0, -98.0)
        self.assertEqual(set(id(p) for p in ordered), set(id(p) for p in points))

    def test_distancia_acotada_por_2x_mst(self):
        """
        Christofides clásico garantiza ≤ 1.5× MST, pero esta implementación
        usa greedy matching en lugar de Blossom V (documentado en greedy_matching),
        lo que pierde esa garantía teórica.

        Usamos una cota relajada de 2× MST que cualquier heurística razonable
        basada en MST + shortcutting debe cumplir.
        """
        coords = [(19.0 + i * 0.05, -99.0 + i * 0.05) for i in range(8)]
        points = self._make_mock_points(coords)
        _, optimized_dist = optimize_route(points, 19.0, -99.0)

        wh = (19.0, -99.0)
        all_coords = [wh] + coords
        graph = build_distance_matrix(all_coords)
        adj = prim_mst(graph, len(all_coords))
        mst_weight = 0
        for u in range(len(all_coords)):
            for v in adj[u]:
                mst_weight += graph[u][v]
        mst_weight /= 2  # cada arista contada dos veces
        # Cota relajada: ≤ 2× MST (válida para heurísticas MST-based)
        # Se agrega 0.01 de tolerancia porque optimize_route aplica round(..., 4)
        self.assertLessEqual(optimized_dist, mst_weight * 2.0 + 0.01)

    def test_distancia_con_2opt_mejor_o_igual_que_sin(self):
        """Demuestra que 2-opt no empeora la solución de Christofides."""
        coords = [(19.0 + i * 0.1, -99.0 + i * 0.05) for i in range(10)]
        all_coords = [(18.0, -98.0)] + coords
        graph = build_distance_matrix(all_coords)

        tour_christofides = christofides_tour(graph, len(all_coords))
        dist_christofides = _tour_distance(tour_christofides, graph)

        tour_2opt = two_opt(tour_christofides[:], graph)
        dist_2opt = _tour_distance(tour_2opt, graph)

        self.assertLessEqual(dist_2opt, dist_christofides + 1e-9)

    def test_resultado_deterministico(self):
        """Mismo input → mismo output (determinismo)."""
        coords = [(19.0 + i * 0.2, -99.0 + i * 0.1) for i in range(6)]
        points = self._make_mock_points(coords)

        ordered1, dist1 = optimize_route(points, 19.0, -99.0)
        ordered2, dist2 = optimize_route(points, 19.0, -99.0)

        self.assertAlmostEqual(dist1, dist2, places=6)
        ids1 = [id(p) for p in ordered1]
        ids2 = [id(p) for p in ordered2]
        self.assertEqual(ids1, ids2)
