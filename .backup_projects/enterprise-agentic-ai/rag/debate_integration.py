from rag.engine import get_rag_engine
from core.config import get_settings

def retrieve_debate_context(topic: str):
    engine = get_rag_engine(get_settings())
    # Retrieve context relevant to the bull/bear topic
    results = engine.query(topic, top_k=3)
    return "\n".join([doc.get('content', '') for doc in results])
