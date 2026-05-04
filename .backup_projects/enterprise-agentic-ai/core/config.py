"""
Enterprise Agentic AI Platform - Core Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "Enterprise Agentic AI Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    CACHE_TTL: int = 3600
    CACHE_MAX_SIZE: int = 1000
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./agentic_ai.db"
    
    # OpenTelemetry
    OTEL_SERVICE_NAME: str = "agentic-ai-platform"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    OTEL_TRACES_EXPORTER: str = "otlp"
    OTEL_METRICS_EXPORTER: str = "otlp"
    
    # Prometheus
    PROMETHEUS_PORT: int = 9090
    
    # MCP Server
    MCP_SERVER_HOST: str = "0.0.0.0"
    MCP_SERVER_PORT: int = 8002
    
    # RAG Engine
    RAG_VECTOR_DB_PATH: str = "./data/chroma_db"
    RAG_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    RAG_CHUNK_SIZE: int = 500
    RAG_CHUNK_OVERLAP: int = 50
    RAG_TOP_K: int = 5
    
    # Agent Configuration
    AGENT_MAX_ITERATIONS: int = 100
    AGENT_TIMEOUT: int = 300
    
    # GUI
    GUI_HOST: str = "0.0.0.0"
    GUI_PORT: int = 8000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
