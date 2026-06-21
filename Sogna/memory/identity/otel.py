"""
Sogna OpenTelemetry Setup — Core F0
=====================================
Inicializa el TracerProvider global con exporter dinámico:

  - Sin OTEL_EXPORTER_OTLP_ENDPOINT: ConsoleSpanExporter (local dev, cero config).
  - Con OTEL_EXPORTER_OTLP_ENDPOINT: OTLPSpanExporter HTTP → Grafana Cloud / cualquier
    colector compatible. Headers via OTEL_EXPORTER_OTLP_HEADERS.

Variables de entorno reconocidas:
  OTEL_SERVICE_NAME               nombre del servicio (default: sogna-uma)
  OTEL_SERVICE_VERSION            versión (default: 0.1.0)
  OTEL_DEPLOYMENT_ENVIRONMENT     entorno (default: local)
  OTEL_EXPORTER_OTLP_ENDPOINT     URL OTLP HTTP; vacío = console only
  OTEL_EXPORTER_OTLP_HEADERS      headers CSV  (Authorization=Bearer XXX,...)
  OTEL_SDK_DISABLED               "true" para desactivar completamente (tests)

Uso:
  from otel import setup_telemetry, get_tracer
  setup_telemetry()
  tracer = get_tracer("my.component")
  with tracer.start_as_current_span("operacion") as span:
      span.set_attribute("key", "value")
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter,
    SimpleSpanProcessor,
)
from opentelemetry.semconv.resource import ResourceAttributes

logger = logging.getLogger("otel")

# Sentinel para saber si ya se inicializó
_initialized = False
_provider: Optional[TracerProvider] = None


def _normalize_otlp_traces_endpoint(url: str) -> str:
    """
    Normaliza el endpoint OTLP HTTP para trazas.
    Grafana Cloud entrega .../otlp; el exporter Python necesita .../otlp/v1/traces.
    """
    url = url.rstrip("/")
    if url.endswith("/v1/traces"):
        return url
    if url.endswith("/otlp"):
        return f"{url}/v1/traces"
    return url


def setup_telemetry(
    service_name: str | None = None,
    service_version: str | None = None,
    environment: str | None = None,
) -> TracerProvider:
    """
    Configura el TracerProvider global de Sogna.
    Idempotente: llamadas posteriores devuelven el provider ya creado.
    """
    global _initialized, _provider
    if _initialized and _provider is not None:
        return _provider

    if os.environ.get("OTEL_SDK_DISABLED", "").lower() == "true":
        logger.info("[OTel] SDK desactivado por OTEL_SDK_DISABLED=true")
        _provider = TracerProvider()
        trace.set_tracer_provider(_provider)
        _initialized = True
        return _provider

    svc_name = (
        service_name
        or os.environ.get("OTEL_SERVICE_NAME", "sogna-uma")
    )
    svc_version = (
        service_version
        or os.environ.get("OTEL_SERVICE_VERSION", "0.1.0")
    )
    env = (
        environment
        or os.environ.get("OTEL_DEPLOYMENT_ENVIRONMENT", "local")
    )

    resource = Resource.create({
        SERVICE_NAME: svc_name,
        SERVICE_VERSION: svc_version,
        ResourceAttributes.DEPLOYMENT_ENVIRONMENT: env,
    })

    provider = TracerProvider(resource=resource)

    otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip()

    if otlp_endpoint:
        # Grafana Cloud / colector OTLP HTTP
        headers_raw = os.environ.get("OTEL_EXPORTER_OTLP_HEADERS", "")
        headers = _parse_headers(headers_raw)
        try:
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
            traces_endpoint = _normalize_otlp_traces_endpoint(otlp_endpoint)
            otlp_exporter = OTLPSpanExporter(
                endpoint=traces_endpoint,
                headers=headers,
            )
            provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
            logger.info("[OTel] OTLP HTTP exporter -> %s (svc=%s, env=%s)", traces_endpoint, svc_name, env)
        except ImportError:
            logger.warning("[OTel] opentelemetry-exporter-otlp-proto-http no disponible; usando console.")
            provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
    else:
        # Local dev: console exporter (sin dependencias externas)
        provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
        logger.info("[OTel] Console exporter activo (svc=%s, env=%s). Set OTEL_EXPORTER_OTLP_ENDPOINT para Grafana Cloud.", svc_name, env)

    trace.set_tracer_provider(provider)
    _provider = provider
    _initialized = True
    return provider


def get_tracer(name: str, version: str = "") -> trace.Tracer:
    """
    Devuelve un tracer con el nombre dado.
    Llama a setup_telemetry() si aún no se ha inicializado.
    """
    if not _initialized:
        setup_telemetry()
    return trace.get_tracer(name, version)


def _parse_headers(raw: str) -> dict[str, str]:
    """
    Parsea headers CSV: 'Authorization=Basic XXX,X-Custom=val' → dict.
    Decodifica %20 etc. (Grafana a veces entrega Basic%20 en lugar de espacio).
    """
    from urllib.parse import unquote

    headers: dict[str, str] = {}
    for part in raw.split(","):
        part = part.strip()
        if "=" in part:
            k, _, v = part.partition("=")
            headers[k.strip()] = unquote(v.strip())
    return headers
