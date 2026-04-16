"""
tasks.py — Tareas asíncronas con Django Q

Cada función de este módulo es una tarea encolable vía django_q.tasks.async_task().
"""

import time
from django_q.tasks import async_task
from loguru import logger

from .services import process_route


def task_process_route(route_id: int) -> None:
    """
    Tarea que Django Q ejecuta en un worker separado.
    Delega completamente en services.process_route().
    """
    start = time.perf_counter()
    logger.info(
        "task_process_route | action=start | task_name=process_route_{route_id} | route_id={route_id}",
        route_id=route_id,
    )

    try:
        process_route(route_id)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "task_process_route | action=end | result=success | route_id={route_id} "
            "| execution_time_ms={elapsed_ms}",
            route_id=route_id,
            elapsed_ms=elapsed_ms,
        )
    except Exception as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.critical(
            "task_process_route | action=end | result=unhandled_exception | route_id={route_id} "
            "| error={error} | execution_time_ms={elapsed_ms}",
            route_id=route_id,
            error=str(exc),
            elapsed_ms=elapsed_ms,
        )
        raise


def enqueue_process_route(route_id: int) -> str:
    """
    Encola task_process_route y devuelve el task_id de Django Q.

    El task_id puede guardarse si se necesita hacer polling
    del estado de la tarea.
    """
    task_name = f"process_route_{route_id}"
    try:
        task_id = async_task(
            "apps.deliveries.tasks.task_process_route",
            route_id,
            task_name=task_name,
        )
        logger.info(
            "enqueue_process_route | action=enqueued | result=success | route_id={route_id} "
            "| task_id={task_id} | task_name={task_name}",
            route_id=route_id,
            task_id=task_id,
            task_name=task_name,
        )
        return task_id
    except Exception as exc:
        logger.error(
            "enqueue_process_route | action=enqueue_failed | result=failure | route_id={route_id} "
            "| task_name={task_name} | error={error}",
            route_id=route_id,
            task_name=task_name,
            error=str(exc),
        )
        raise