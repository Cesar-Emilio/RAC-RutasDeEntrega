"""
tasks.py — Tareas asíncronas con Django Q

Cada función de este módulo es una tarea encolable vía django_q.tasks.async_task().
"""

import logging
from django_q.tasks import async_task

from .services import process_route
logger = logging.getLogger(__name__)

def task_process_route(route_id: int) -> None:
    """
    Tarea que Django Q ejecuta en un worker separado.
    Delega completamente en services.process_route().
    """
    logger.info("task_process_route: iniciando para ruta %s.", route_id)
    process_route(route_id)
    logger.info("task_process_route: finalizado para ruta %s.", route_id)


def enqueue_process_route(route_id: int) -> str:
    """
    Encola task_process_route y devuelve el task_id de Django Q.

    El task_id puede guardarse si se necesita hacer polling
    del estado de la tarea
    """
    task_id = async_task(
        "apps.deliveries.tasks.task_process_route",
        route_id,
        task_name=f"process_route_{route_id}",
    )
    logger.info("Ruta %s encolada con task_id %s.", route_id, task_id)
    return task_id