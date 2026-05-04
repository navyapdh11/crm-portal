"""
Enterprise Agentic AI Platform - Database Models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class Agent(Base):
    """Agent configuration and state model"""
    __tablename__ = "agents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    agent_type = Column(String(50), nullable=False)  # autoresearch, rag, mcp, etc.
    config = Column(JSON, default=dict)
    state = Column(String(50), default="inactive")  # inactive, active, paused, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    metadata = Column(JSON, default=dict)


class Experiment(Base):
    """Experiment tracking model"""
    __tablename__ = "experiments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="running")  # running, completed, failed, cancelled
    metric_name = Column(String(100))
    metric_value = Column(Float)
    iteration = Column(Integer, default=0)
    max_iterations = Column(Integer, default=100)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    results = Column(JSON, default=dict)
    error_message = Column(Text)


class ExperimentLog(Base):
    """Individual experiment iteration log"""
    __tablename__ = "experiment_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id = Column(String(36), nullable=False)
    iteration = Column(Integer, nullable=False)
    commit_hash = Column(String(100))
    accuracy = Column(Float)
    status = Column(String(50))  # keep, discard
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(JSON, default=dict)


class RAGDocument(Base):
    """RAG document storage"""
    __tablename__ = "rag_documents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    metadata = Column(JSON, default=dict)
    embedding_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class MCPTool(Base):
    """MCP tool registration"""
    __tablename__ = "mcp_tools"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    schema = Column(JSON, nullable=False)
    handler = Column(String(255), nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class APIKey(Base):
    """API key management"""
    __tablename__ = "api_keys"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key_hash = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    permissions = Column(JSON, default=dict)
    rate_limit = Column(Integer, default=1000)  # requests per hour
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    last_used_at = Column(DateTime(timezone=True))
