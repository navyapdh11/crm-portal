from fastmcp import FastMCP
from pydantic import BaseModel, Field
import asyncio, os, json, logging, traceback

# Setup logging
logging.basicConfig(level=logging.DEBUG, filename='/root/mcp-advanced.log', 
                    format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger("mcp-advanced")

mcp = FastMCP("advanced-arm64-error")

class SearchInput(BaseModel):
    query: str = Field(..., min_length=1)

@mcp.tool
async def smart_search(input: SearchInput) -> dict:
    """Safe search with full error handling"""
    try:
        logger.info(f"Starting search for: {input.query}")
        await mcp.send_progress("Scanning files...")

        results = []
        for f in os.listdir("/root"):
            if input.query.lower() in f.lower():
                results.append(f)

        await asyncio.sleep(0.3)  # simulate work
        return {
            "status": "success",
            "files_found": results,
            "count": len(results),
            "query": input.query
        }
    except FileNotFoundError:
        logger.error("Directory not found")
        return {"status": "error", "message": "Target folder does not exist"}
    except PermissionError:
        logger.error("Permission denied")
        return {"status": "error", "message": "Permission denied — try running as root"}
    except Exception as e:
        logger.error(f"Unexpected error: {traceback.format_exc()}")
        return {
            "status": "error",
            "message": "Internal tool error",
            "debug": str(e)[:200]   # truncated for safety
        }

if __name__ == "__main__":
    try:
        mcp.run()
    except Exception as e:
        logger.critical(f"Tool crashed: {traceback.format_exc()}")
        print(f"MCP tool crashed: {e}")
