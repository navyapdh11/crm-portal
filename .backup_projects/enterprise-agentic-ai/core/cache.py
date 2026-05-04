"""
Redis Cache Manager - Enterprise-grade caching layer
"""
import redis
import json
import pickle
from typing import Any, Optional, Dict, List
from functools import wraps
import hashlib
import logging
from core.config import Settings

logger = logging.getLogger(__name__)


class CacheManager:
    """Redis-based cache manager with advanced features"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            decode_responses=True,
            socket_connect_timeout=5,
            retry_on_timeout=True
        )
        self._check_connection()
        logger.info(f"Redis cache manager connected to {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    
    def _check_connection(self):
        """Test Redis connection"""
        try:
            self.redis_client.ping()
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    def _generate_key(self, prefix: str, key: str) -> str:
        """Generate a cache key with hash"""
        key_hash = hashlib.md5(key.encode()).hexdigest()[:8]
        return f"{prefix}:{key_hash}:{key}"
    
    async def get(self, key: str, prefix: str = "cache") -> Optional[Any]:
        """Get value from cache"""
        try:
            cache_key = self._generate_key(prefix, key)
            value = self.redis_client.get(cache_key)
            
            if value:
                from observability.metrics import CACHE_HITS
                CACHE_HITS.labels(cache_type=prefix).inc()
                return json.loads(value)
            
            from observability.metrics import CACHE_MISSES
            CACHE_MISSES.labels(cache_type=prefix).inc()
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None, prefix: str = "cache") -> bool:
        """Set value in cache"""
        try:
            cache_key = self._generate_key(prefix, key)
            ttl = ttl or self.settings.CACHE_TTL
            serialized = json.dumps(value, default=str)
            
            self.redis_client.setex(cache_key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str, prefix: str = "cache") -> bool:
        """Delete key from cache"""
        try:
            cache_key = self._generate_key(prefix, key)
            self.redis_client.delete(cache_key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def exists(self, key: str, prefix: str = "cache") -> bool:
        """Check if key exists in cache"""
        try:
            cache_key = self._generate_key(prefix, key)
            return self.redis_client.exists(cache_key)
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
    
    async def get_pattern(self, pattern: str) -> Dict[str, Any]:
        """Get all keys matching pattern"""
        try:
            keys = self.redis_client.keys(pattern)
            result = {}
            for key in keys:
                value = self.redis_client.get(key)
                if value:
                    result[key] = json.loads(value)
            return result
        except Exception as e:
            logger.error(f"Cache get_pattern error: {e}")
            return {}
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment a counter"""
        try:
            return self.redis_client.incr(key, amount)
        except Exception as e:
            logger.error(f"Cache increment error: {e}")
            return 0
    
    async def get_ttl(self, key: str, prefix: str = "cache") -> int:
        """Get TTL for a key"""
        try:
            cache_key = self._generate_key(prefix, key)
            return self.redis_client.ttl(cache_key)
        except Exception as e:
            logger.error(f"Cache get_ttl error: {e}")
            return -1
    
    async def flush_db(self) -> bool:
        """Flush entire database (use with caution!)"""
        try:
            self.redis_client.flushdb()
            logger.warning("Cache database flushed")
            return True
        except Exception as e:
            logger.error(f"Cache flush_db error: {e}")
            return False
    
    def cached(self, ttl: Optional[int] = None, prefix: str = "cache"):
        """Decorator for caching function results"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key from function name and arguments
                key_data = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                cache_key = self._generate_key(prefix, key_data)
                
                # Try to get from cache
                cached_value = await self.get(key_data, prefix)
                if cached_value is not None:
                    return cached_value
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self.set(key_data, result, ttl, prefix)
                return result
            return wrapper
        return decorator


# Global cache instance
_cache_manager: Optional[CacheManager] = None


def get_cache_manager(settings: Settings) -> CacheManager:
    """Get or create cache manager instance"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager(settings)
    return _cache_manager
