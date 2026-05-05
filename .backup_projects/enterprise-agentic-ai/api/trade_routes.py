from fastapi import APIRouter
from pydantic import BaseModel
from agents.trading.orchestrator import app as trading_app

router = APIRouter(prefix="/api/v1/trade")

class TradeRequest(BaseModel):
    ticker: str

@router.post("/infer")
async def trade_infer(request: TradeRequest):
    result = trading_app.invoke({"ticker": request.ticker})
    return result

