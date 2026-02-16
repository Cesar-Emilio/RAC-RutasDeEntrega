# RAC — Plataforma de Gestión de Rutas de Entrega

Sistema web que permite calcular rutas óptimas de entrega para una flota de vehículos, a partir de un conjunto de direcciones proporcionadas por empresas, utilizando algoritmos de búsqueda de caminos (Dijkstra y A\*).

El sistema genera rutas visualizables en mapas interactivos y archivos descargables con los resultados.

---

## Objetivo

Desarrollar un sistema modular, escalable y eficiente para el cálculo de rutas óptimas, con:

- Procesamiento eficiente
- Arquitectura desacoplada
- Visualización clara
- Escalabilidad futura para múltiples vehículos

---

## Características principales

### Gestión de usuarios y empresas
- Autenticación mediante JWT
- Roles: Administrador y Empresa
- CRUD completo de empresas

### Gestión de consultas
- Carga de archivos con múltiples direcciones
- Definición de punto inicial
- Historial de consultas

### Procesamiento de rutas
- Algoritmos:
  - Dijkstra
  - A\*
- Generación de rutas óptimas
- Exportación de resultados

### Visualización
- Mapas interactivos
- Visualización clara de trayectos