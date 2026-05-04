#!/bin/bash
cd /root/enterprise-agentic-ai
source venv/bin/activate
exec uvicorn api.main:app --host 0.0.0.0 --port 8100
