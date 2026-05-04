"""
OpenTelemetry Distributed Tracing Setup
"""
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from typing import TYPE_CHECKING
import logging

if TYPE_CHECKING:
    from core.config import Settings

logger = logging.getLogger(__name__)


def setup_tracing(settings: "Settings") -> trace.TracerProvider:
    """Setup OpenTelemetry distributed tracing"""
    
    # Create resource with service info
    resource = Resource.create({
        "service.name": settings.OTEL_SERVICE_NAME,
        "service.version": "1.0.0",
        "deployment.environment": "production" if not settings.DEBUG else "development"
    })
    
    # Create tracer provider
    tracer_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer_provider)
    
    # Setup OTLP exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT,
        insecure=True
    )
    
    # Add batch span processor
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)
    
    # Instrument FastAPI
    from api.main import app
    FastAPIInstrumentor.instrument_app(app)
    
    # Instrument HTTPX client
    HTTPXClientInstrumentor().instrument()
    
    # Instrument Redis
    try:
        RedisInstrumentor().instrument()
    except Exception as e:
        logger.warning(f"Could not instrument Redis: {e}")
    
    # Instrument SQLAlchemy
    try:
        from core.database import engine
        SQLAlchemyInstrumentor().instrument(engine=engine)
    except Exception as e:
        logger.warning(f"Could not instrument SQLAlchemy: {e}")
    
    logger.info(f"OpenTelemetry tracing setup complete -> {settings.OTEL_EXPORTER_OTLP_ENDPOINT}")
    
    return tracer_provider


def get_tracer(name: str) -> trace.Tracer:
    """Get a tracer instance"""
    return trace.get_tracer(name)


def trace_agent_operation(agent_name: str, operation: str):
    """Decorator to trace agent operations"""
    from functools import wraps
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            tracer = get_tracer(f"agent.{agent_name}")
            with tracer.start_as_current_span(
                f"{agent_name}.{operation}",
                attributes={
                    "agent.name": agent_name,
                    "operation.type": operation
                }
            ) as span:
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("operation.status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("operation.status", "error")
                    span.record_exception(e)
                    raise
        return wrapper
    return decorator
