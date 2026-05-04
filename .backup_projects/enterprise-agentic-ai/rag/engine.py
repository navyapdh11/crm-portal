"""
RAG Engine - Retrieval-Augmented Generation with vector database
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from typing import List, Dict, Optional, Any
import logging
from core.config import Settings
from opentelemetry import trace
import time

logger = logging.getLogger(__name__)
tracer = trace.get_tracer("rag_engine")


class RAGEngine:
    """RAG engine with ChromaDB vector store"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.RAG_EMBEDDING_MODEL
        )
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=settings.RAG_VECTOR_DB_PATH
        )
        
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.RAG_CHUNK_SIZE,
            chunk_overlap=settings.RAG_CHUNK_OVERLAP,
            length_function=len,
        )
        
        logger.info(f"RAG Engine initialized with model: {settings.RAG_EMBEDDING_MODEL}")
    
    def add_document(self, doc_id: str, content: str, metadata: Optional[Dict] = None) -> str:
        """Add document to vector store"""
        with tracer.start_as_current_span("rag.add_document") as span:
            span.set_attribute("document.id", doc_id)
            
            # Split document
            chunks = self.text_splitter.split_text(content)
            span.set_attribute("document.chunks", len(chunks))
            
            # Generate IDs for chunks
            chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            
            # Add metadata
            metadatas = [
                {**(metadata or {}), "doc_id": doc_id, "chunk_index": i}
                for i in range(len(chunks))
            ]
            
            # Add to collection
            self.collection.add(
                documents=chunks,
                ids=chunk_ids,
                metadatas=metadatas
            )
            
            from observability.metrics import RAG_DOCUMENTS_COUNT
            RAG_DOCUMENTS_COUNT.set(self.collection.count())
            
            logger.info(f"Added document {doc_id} with {len(chunks)} chunks")
            return doc_id
    
    def query(self, query_text: str, top_k: Optional[int] = None, filter_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Query the vector store for similar documents"""
        with tracer.start_as_current_span("rag.query") as span:
            span.set_attribute("query.text", query_text[:100])
            start_time = time.time()
            
            top_k = top_k or self.settings.RAG_TOP_K
            
            try:
                results = self.collection.query(
                    query_texts=[query_text],
                    n_results=top_k,
                    where=filter_metadata
                )
                
                duration = time.time() - start_time
                span.set_attribute("query.duration_ms", duration * 1000)
                span.set_attribute("query.results_count", len(results.get("ids", [[]])[0]))
                
                from observability.metrics import RAG_QUERIES_TOTAL, RAG_RETRIEVAL_TIME
                RAG_QUERIES_TOTAL.labels(status="success").inc()
                RAG_RETRIEVAL_TIME.observe(duration)
                
                # Format results
                formatted_results = {
                    "documents": results.get("documents", [[]])[0],
                    "metadatas": results.get("metadatas", [[]])[0],
                    "distances": results.get("distances", [[]])[0],
                    "ids": results.get("ids", [[]])[0],
                    "query_time": duration
                }
                
                logger.debug(f"Query returned {len(formatted_results['documents'])} results in {duration:.3f}s")
                return formatted_results
                
            except Exception as e:
                RAG_QUERIES_TOTAL.labels(status="error").inc()
                span.record_exception(e)
                logger.error(f"Query error: {e}")
                return {"documents": [], "metadatas": [], "distances": [], "ids": [], "error": str(e)}
    
    def delete_document(self, doc_id: str) -> bool:
        """Delete a document and all its chunks"""
        with tracer.start_as_current_span("rag.delete_document") as span:
            span.set_attribute("document.id", doc_id)
            
            try:
                # Find all chunks for this document
                results = self.collection.get(
                    where={"doc_id": doc_id}
                )
                
                if results["ids"]:
                    self.collection.delete(ids=results["ids"])
                    logger.info(f"Deleted document {doc_id} and {len(results['ids'])} chunks")
                    return True
                
                return False
            except Exception as e:
                span.record_exception(e)
                logger.error(f"Delete document error: {e}")
                return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get RAG engine statistics"""
        return {
            "total_documents": self.collection.count(),
            "embedding_model": self.settings.RAG_EMBEDDING_MODEL,
            "chunk_size": self.settings.RAG_CHUNK_SIZE,
            "chunk_overlap": self.settings.RAG_CHUNK_OVERLAP,
            "vector_db_path": self.settings.RAG_VECTOR_DB_PATH
        }
    
    def update_document(self, doc_id: str, content: str, metadata: Optional[Dict] = None) -> str:
        """Update an existing document"""
        # Delete old version
        self.delete_document(doc_id)
        # Add new version
        return self.add_document(doc_id, content, metadata)


# Global RAG engine instance
_rag_engine: Optional[RAGEngine] = None


def get_rag_engine(settings: Settings) -> RAGEngine:
    """Get or create RAG engine instance"""
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGEngine(settings)
    return _rag_engine
