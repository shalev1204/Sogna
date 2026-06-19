"""
Celery app — Sogna Core F0
Broker:  Redis (REDIS_URL, defecto localhost:6379/0)
Backend: Redis (REDIS_URL, misma instancia, DB 1)

Activar worker:  pnpm worker:start
Parar worker:    pnpm worker:stop
Inspect:         celery -A workers.celery_app inspect active
"""
import os
import sys

# Asegurar que el raíz de Sogna está en sys.path para imports cruzados
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Cargar .env antes de leer REDIS_URL
try:
    from memory.identity.load_env import load_sogna_env
    load_sogna_env()
except Exception:
    pass

# OTel — inicializar antes de crear la app Celery para que CeleryInstrumentor
# pueda adjuntar señales a los eventos del worker
try:
    from memory.identity.otel import setup_telemetry
    setup_telemetry(service_name="sogna-worker")
    from opentelemetry.instrumentation.celery import CeleryInstrumentor
    CeleryInstrumentor().instrument()
except Exception as _otel_exc:
    import logging as _log
    _log.getLogger("celery_app").warning("[OTel] Instrumentación Celery no disponible: %s", _otel_exc)

from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
REDIS_RESULT = REDIS_URL.replace("/0", "/1") if REDIS_URL.endswith("/0") else REDIS_URL + "/1"

app = Celery(
    "sogna",
    broker=REDIS_URL,
    backend=REDIS_RESULT,
    include=["workers.tasks"],
)

_is_win = sys.platform == "win32"

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # prefork usa semáforos POSIX — no disponibles en Windows; threads para I/O-bound
    worker_pool="threads" if _is_win else "prefork",
    # soft_time_limit no soportado en Windows (sin SIGUSR1)
    task_soft_time_limit=None if _is_win else 300,
    task_time_limit=600,
    broker_connection_retry_on_startup=True,
    result_expires=3600,
)
