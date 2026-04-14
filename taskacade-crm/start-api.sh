#!/bin/bash
cd /root/taskacade-crm
# Kill old instances safely
for pid in $(pgrep -f "node dist/api"); do
  if [ "$pid" != "$$" ]; then kill $pid 2>/dev/null; fi
done
sleep 2

# Start in background, redirect all output
exec node dist/api/index.js >> /root/taskacade-crm/logs/api.log 2>&1 &
disown
echo $! > /root/taskacade-crm/.api.pid
echo "Started with PID $!"
sleep 3
curl -s http://localhost:4000/health
