            p1, p2, p3 = data.iloc[i][['BTC-USD','ETH-USD','SOL-USD']].values
            beta, _ = kf.update(p1, p2, p3)
            if abs(ret) > 0.03: hawkes.add_event(i)

            state = torch.tensor([ret, 0.25, 0.8, 0.1, 0.05, hawkes.intensity(i), beta[0], beta[1]], dtype=torch.float32)
            states = [state] * agent.n_agents

            q_vals, q_tot = agent(states)
            q_tots.append(q_tot)

            future_ret = (data.iloc[i+30] - data.iloc[i]).mean().item()
            reward = 0.01 * q_vals.mean().item() * future_ret - 0.005 * abs(q_vals.mean().item()) - 0.02 * hawkes.intensity(i)
            rewards.append(reward)

            _, next_q_tot = agent(states)
            next_q_tots.append(next_q_tot)

        if not rewards: continue

        rewards_t = torch.tensor(rewards, dtype=torch.float32).unsqueeze(1)
        q_tot_t = torch.cat(q_tots)
        next_q_t = torch.cat(next_q_tots).detach()
        target = rewards_t + gamma * next_q_t
        loss = F.mse_loss(q_tot_t, target)

        opt.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(agent.parameters(), 1.0)
        opt.step()

        if loss.item() < best_loss:
            best_loss = loss.item()
            torch.save(agent.state_dict(), "best_model.pth")

        if ep % 15 == 0:
            logger.info(f"Ep {ep:3d} | steps {len(rewards)} | avg R {np.mean(rewards):.4f} | loss {loss.item():.6f}")

    torch.save(agent.state_dict(), "multi_agent_trader.pth")
    logger.info("Training finished.")

def run_scanner(live=False):
    logger.info(f"Scanner (live={live})")
    agent = MultiAgentTrader()
    try:
        agent.load_state_dict(torch.load("multi_agent_trader.pth", map_location="cpu"))
        agent.eval()
        logger.info("Model loaded")
    except Exception as e:
        logger.warning(f"Model load failed: {e}. Using random")

    triangles = [('BTC/USDT','ETH/USDT','SOL/USDT')]

    for sym1, sym2, sym3 in triangles:
        try:
            ex = ccxt.binance({'enableRateLimit': True})
            c1 = pd.Series([b[4] for b in ex.fetch_ohlcv(sym1.replace('/',''), '1d', limit=180)])
            c2 = pd.Series([b[4] for b in ex.fetch_ohlcv(sym2.replace('/',''), '1d', limit=180)])
            c3 = pd.Series([b[4] for b in ex.fetch_ohlcv(sym3.replace('/',''), '1d', limit=180)])

            kf = MultivariateKalman3Asset(); hawkes = HawkesGate(); rets = []
            for i in range(1, len(c1)):
                ret = (c1.iloc[i] - c1.iloc[i-1]) / c1.iloc[i-1] if c1.iloc[i-1] else 0
                rets.append(ret)
                kf.update(c1.iloc[i], c2.iloc[i], c3.iloc[i])
                if abs(ret) > 0.03: hawkes.add_event(i)

            current_ret = rets[-1] if rets else 0.0
            hawkes_now = hawkes.intensity(len(c1)-1)
            beta_now = kf.x.flatten()

            state = torch.tensor([current_ret, 0.25, 0.8, 0.1, 0.05, hawkes_now, beta_now[0], beta_now[1]], dtype=torch.float32)
            states = [state] * agent.n_agents

            with torch.no_grad():
                q_vals, _ = agent(states)
            avg_q = q_vals.mean().item()

            spreads = [kf.update(c1.iloc[i], c2.iloc[i], c3.iloc[i])[1] for i in range(len(c1))]
            z = (pd.Series(spreads) - pd.Series(spreads).rolling(30).mean()) / pd.Series(spreads).rolling(30).std()
            z_now = z.iloc[-1] if len(z) >= 30 else 0.0

            signal = "LONG" if z_now < -2 else "SHORT" if z_now > 2 else "NEUTRAL"

            msg = f"**{sym1} triangle** | Z: {z_now:.2f} | {signal} | Hawkes: {hawkes_now:.2f} | Q: {avg_q:.4f}"
            logger.info(msg); send_telegram(msg)

            if live and signal != "NEUTRAL" and hawkes_now < 1.5:
                qty = 0.001 * (1 + abs(avg_q))
                side = "buy" if signal == "LONG" else "sell"
                logger.info(binance_exec(sym1, side, qty))

        except Exception as e:
            logger.error(f"{sym1} failed: {str(e)[:180]}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--train', action='store_true')
    parser.add_argument('--live', action='store_true')
    args = parser.parse_args()
    if args.train:
        train_multi_agent_offline()
    else:
        run_scanner(live=args.live)
EOF

python kalman_pro_2026.py --train && python kalman_pro_2026.py
source ~/.kalman_venv/bin/activate && pip install --quiet --upgrade pip setuptools wheel && pip install --quiet yfinance pandas numpy ccxt requests torch arch && cd ~/.openclaw/workspace/tools/kalman_trading && rm -f multi_agent_trader.pth best_model.pth && cat > kalman_pro_2026.py << 'EOF'
import argparse
import logging
import os
import numpy as np
import pandas as pd
import yfinance as yf
import ccxt
import requests
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT  = os.getenv("TELEGRAM_CHAT_ID")
BINANCE_KEY    = os.getenv("BINANCE_API_KEY")
BINANCE_SECRET = os.getenv("BINANCE_API_SECRET")

def send_telegram(msg):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT: return
    try:
        requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                      data={"chat_id": TELEGRAM_CHAT, "text": msg, "parse_mode": "Markdown"})
    except:
        pass

def binance_exec(symbol, side, qty):
    if not BINANCE_KEY:
        msg = f"DRY-RUN: {side.upper()} {qty:.6f} {symbol}"
        logger.info(msg); send_telegram(msg); return msg
    try:
        ex = ccxt.binance({'apiKey': BINANCE_KEY, 'secret': BINANCE_SECRET, 'enableRateLimit': True})
        order = ex.create_market_order(symbol, side, qty)
        msg = f"EXECUTED {side.upper()} {qty:.6f} {symbol} | ID {order.get('id','')}"
        logger.info(msg); send_telegram(msg); return msg
    except Exception as e:
        return f"EXEC FAIL: {str(e)[:120]}"

class HawkesGate:
    def __init__(self, mu=0.1, alpha=0.5, beta=2.0):
        self.mu, self.alpha, self.beta = mu, alpha, beta
        self.events = []
    def add_event(self, t): self.events.append(t)
    def intensity(self, t):
        return self.mu + sum(self.alpha * np.exp(-self.beta * (t - ti)) for ti in self.events)

class MultivariateKalman3Asset:
    def __init__(self):
        self.x = np.array([[1.0], [0.5], [0.0]])
        self.P = np.eye(3) * 5.0
        self.Q = np.diag([1e-5, 1e-5, 1e-6])
        self.R = np.array([[2.0]])
    def update(self, p1, p2, p3):
        x_pred = self.x.copy(); P_pred = self.P + self.Q
        H = np.array([[p2, p3, 1.0]]); z = np.array([[p1]])
        y = z - H @ x_pred; S = H @ P_pred @ H.T + self.R
        K = P_pred @ H.T @ np.linalg.inv(S)
        self.x = x_pred + K @ y
        IKH = np.eye(3) - K @ H
        self.P = IKH @ P_pred @ IKH.T + K @ self.R @ K.T
        return self.x.flatten(), y[0,0]

class MultiAgentTrader(nn.Module):
    def __init__(self, state_dim=8, n_agents=3):
        super().__init__()
        self.n_agents = n_agents
        self.embed = nn.Linear(state_dim, 64)
        self.attn = nn.MultiheadAttention(embed_dim=64, num_heads=4, batch_first=True)
        self.norm = nn.LayerNorm(64)
        self.actors = nn.ModuleList([
            nn.Sequential(nn.Linear(64, 32), nn.ReLU(), nn.Linear(32, 1), nn.Tanh())
            for _ in range(n_agents)
        ])
        self.qmix = QMIXMixer(n_agents, 64 * n_agents)

    def forward(self, states):
        # states: list of n_agents tensors, each [state_dim]
        x = torch.stack([self.embed(s) for s in states], dim=0).unsqueeze(0)  # → [1, n_agents, 64]
        attn_out, _ = self.attn(x, x, x)
        x = self.norm(x + attn_out)
        q_vals = torch.cat([act(x[0, i]) for i, act in enumerate(self.actors)], dim=0).unsqueeze(0)  # [1, n_agents]
        global_s = x.view(1, -1)
        q_tot = self.qmix(q_vals, global_s)
        return q_vals, q_tot

class QMIXMixer(nn.Module):
    def __init__(self, n_agents, state_dim):
        super().__init__()
        self.hyper_w = nn.Sequential(nn.Linear(state_dim, 128), nn.ReLU(), nn.Linear(128, n_agents * n_agents))
        self.V = nn.Sequential(nn.Linear(state_dim, 128), nn.ReLU(), nn.Linear(128, 1))
    def forward(self, q_values, s):
        w = torch.abs(self.hyper_w(s)).view(-1, q_values.shape[1], q_values.shape[1])
        q_tot = torch.bmm(q_values.unsqueeze(1), w).squeeze(1) + self.V(s)
        return q_tot

def train_multi_agent_offline(episodes=60):
    agent = MultiAgentTrader()
    opt = optim.Adam(agent.parameters(), lr=3e-4)
    gamma = 0.98
    best_loss = float('inf')

    for ep in range(episodes):
        try:
            data = yf.download(['BTC-USD','ETH-USD','SOL-USD'], period='9mo', progress=False)['Close']
            if len(data) < 200: raise Exception()
        except:
            data = pd.DataFrame(np.random.randn(700,3), columns=['BTC-USD','ETH-USD','SOL-USD'])

        kf = MultivariateKalman3Asset()
        hawkes = HawkesGate()
        rewards, q_tots, next_q_tots = [], [], []

        for i in range(1, len(data)-30):
            ret = (data.iloc[i] - data.iloc[i-1]).mean()
            p1, p2, p3 = data.iloc[i][['BTC-USD','ETH-USD','SOL-USD']].values
            beta, _ = kf.update(p1, p2, p3)
            if abs(ret) > 0.03: hawkes.add_event(i)

            state = torch.tensor([ret, 0.25, 0.8, 0.1, 0.05, hawkes.intensity(i), beta[0], beta[1]], dtype=torch.float32)
            states = [state] * agent.n_agents

            q_vals, q_tot = agent(states)
            q_tots.append(q_tot)

            future_ret = (data.iloc[i+30] - data.iloc[i]).mean().item()
            reward = 0.01 * q_vals.mean().item() * future_ret - 0.005 * abs(q_vals.mean().item()) - 0.02 * hawkes.intensity(i)
            rewards.append(reward)

            _, next_q_tot = agent(states)
            next_q_tots.append(next_q_tot)

        if not rewards: continue

        rewards_t = torch.tensor(rewards, dtype=torch.float32).unsqueeze(1)
        q_tot_t = torch.cat(q_tots)
        next_q_t = torch.cat(next_q_tots).detach()
        target = rewards_t + gamma * next_q_t
        loss = F.mse_loss(q_tot_t, target)

        opt.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(agent.parameters(), 1.0)
        opt.step()

        if loss.item() < best_loss:
            best_loss = loss.item()
            torch.save(agent.state_dict(), "best_model.pth")

        if ep % 15 == 0:
            logger.info(f"Ep {ep:3d} | steps {len(rewards)} | avg R {np.mean(rewards):.4f} | loss {loss.item():.6f}")

    torch.save(agent.state_dict(), "multi_agent_trader.pth")
    logger.info("Training finished.")

def run_scanner(live=False):
    logger.info(f"Scanner (live={live})")
    agent = MultiAgentTrader()
    try:
        agent.load_state_dict(torch.load("multi_agent_trader.pth", map_location="cpu"))
        agent.eval()
        logger.info("Model loaded")
    except Exception as e:
        logger.warning(f"Model load failed: {e}. Using random")

    triangles = [('BTC/USDT','ETH/USDT','SOL/USDT')]

    for sym1, sym2, sym3 in triangles:
        try:
            ex = ccxt.binance({'enableRateLimit': True})
            c1 = pd.Series([b[4] for b in ex.fetch_ohlcv(sym1.replace('/',''), '1d', limit=180)])
            c2 = pd.Series([b[4] for b in ex.fetch_ohlcv(sym2.replace('/',''), '1d', limit=180)])
            c3 = pd.Series([b[4] for b in ex.fetch_ohlcv(sym3.replace('/',''), '1d', limit=180)])

            kf = MultivariateKalman3Asset(); hawkes = HawkesGate(); rets = []
            for i in range(1, len(c1)):
                ret = (c1.iloc[i] - c1.iloc[i-1]) / c1.iloc[i-1] if c1.iloc[i-1] else 0
                rets.append(ret)
                kf.update(c1.iloc[i], c2.iloc[i], c3.iloc[i])
                if abs(ret) > 0.03: hawkes.add_event(i)

            current_ret = rets[-1] if rets else 0.0
            hawkes_now = hawkes.intensity(len(c1)-1)
            beta_now = kf.x.flatten()

            state = torch.tensor([current_ret, 0.25, 0.8, 0.1, 0.05, hawkes_now, beta_now[0], beta_now[1]], dtype=torch.float32)
            states = [state] * agent.n_agents

            with torch.no_grad():
                q_vals, _ = agent(states)
            avg_q = q_vals.mean().item()

            spreads = [kf.update(c1.iloc[i], c2.iloc[i], c3.iloc[i])[1] for i in range(len(c1))]
            z = (pd.Series(spreads) - pd.Series(spreads).rolling(30).mean()) / pd.Series(spreads).rolling(30).std()
            z_now = z.iloc[-1] if len(z) >= 30 else 0.0

            signal = "LONG" if z_now < -2 else "SHORT" if z_now > 2 else "NEUTRAL"

            msg = f"**{sym1} triangle** | Z: {z_now:.2f} | {signal} | Hawkes: {hawkes_now:.2f} | Q: {avg_q:.4f}"
            logger.info(msg); send_telegram(msg)

            if live and signal != "NEUTRAL" and hawkes_now < 1.5:
                qty = 0.001 * (1 + abs(avg_q))
                side = "buy" if signal == "LONG" else "sell"
                logger.info(binance_exec(sym1, side, qty))

        except Exception as e:
            logger.error(f"{sym1} failed: {str(e)[:180]}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--train', action='store_true')
    parser.add_argument('--live', action='store_true')
    args = parser.parse_args()
    if args.train:
        train_multi_agent_offline()
    else:
        run_scanner(live=args.live)
EOF

】
exit
source ~/.bashrc
x --help
x env
exit
~/.termux/boot/start-dashy
exit
cd ~/dashy
pkill -f "yarn start" 2>/dev/null
PORT=4000 nohup yarn start > ~/.dashy.log 2>&1 &
sleep 5
tail -n 20 ~/.dashy.log   # ← check if it says "App running at: http://localhost:4000/"
exit
# Source - https://askubuntu.com/questions/656821/bash-is-looking-for-a-missing-unexpected-eof
# Posted by Chill, modified by community. See post 'Timeline' for change history
# Retrieved 01/03/2026, License - null
120  export PATH="/home/chill/android-studio/bin
                  ^––SC1078 Did you forget to close this double quoted string?

121  export PATH="$HOME/.rbenv/bin:$PATH"
                  ^––SC1079 This is actually an end quote, but due to next char it looks suspect.

# Source - https://askubuntu.com/questions/656821/bash-is-looking-for-a-missing-unexpected-eof
# Posted by Chill, modified by community. See post 'Timeline' for change history
# Retrieved 01/03/2026, License - null
120  export PATH="/home/chill/android-studio/bin
                  ^––SC1078 Did you forget to close this double quoted string?

121  export PATH="$HOME/.rbenv/bin:$PATH"
                  ^––SC1079 This is actually an end quote, but due to next char it looks suspect.



exit
init
hint: Using 'master' as the name for the initial branch. This default branch name
hint: is subject to change. To configure the initial branch name to use in all                          hint: of your new repositories, which will suppress this warning, call:
hint:                                               hint:   git config --global init.defaultBranch <name>
hint:
hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
hint: 'development'. The just-created branch can be renamed via this command:                           hint:
hint:   git branch -m <name>
hint:                                               hint: Disable this message with "git config set advice.defaultBranchName false"
Initialized empty Git repository in /home/navya/.git/
source ~/.kalman_venv/bin/activate
python kalman_pro_2026.py --train
ccp
ccr
q
ccr ui
ccr code
python3 -m venv ~/aider-venv
source ~/aider-venv/bin/activate
pip install -U aider-chat
aider --browser
aidar
exit
user navya
exit
npm 
whoami
npx sandbox create --connect
qwen
kiro
kiro-code
kiro-cli
cd                                                  /root/.openclaw/workspace/tools/g4h_quant_          engine 
cd /root/.openclaw/workspace/tools/g4h_quant_
cd + source venv/bin/activate
cd source venv/bin/activate
# 1. Go to the correct folder
cd /root/.openclaw/workspace/tools/g4h_quant_engine
# 2. Activate the virtual environment
source venv/bin/activate
# Start the trading bot API server
python main.py
qwen
# 1. Fast health check (should return "healthy")
curl http://localhost:8000/health
# 2. Scan SPY vs QQQ right now (this is the main feature)
curl http://localhost:8000/api/v1/scan/SPY_QQQ
q
gemini
cursor --no-sandbox
bash <(curl -Lk https://github.com/kingparks/cursor-vip/releases/download/latest/i.sh) githubReadme
cd /root/Downloads
chmod +x DeepChat.AppImage
echo "Extracting Cursor AppImage... (takes 20-60 seconds)"
./DeepChat.AppImage --appimage-extract
apt install -y squashfs-tools
echo "Extracting Cursor (this takes 30-90 seconds)..."
# Extract the AppImage manually (this is the fix for proot)
OFFSET=$(LC_ALL=C grep -aob -- 'hsqs' DeepChat.AppImage | head -n1 | cut -d: -f1)
unsquashfs -o "$OFFSET" -d squashfs-root DeepChat.AppImage
rm -f DeepChat.AppImage
Get the **latest** cursor.sh (this version uses .deb, no AppImage)
wget -O cursor.sh https://raw.githubusercontent.com/MaheshTechnicals/cursor-free-vip-termux/refs/heads/main/cursor.sh
chmod +x cursor.sh
Update Cursor (downloads the real latest Cursor .deb)
sudo ./cursor.sh -p
cursor --version
exit
qwen
cd /root/lumina-clean-v6 && rm -rf .next && pnpm exec next dev --port 3014 > /tmp/nextdev11.log 2>&1
d /root/lumina-clean-v6 && /root/.local/share/pnpm/pnpm exec next dev --port 3015 > /tmp/nextdev12.log 2>&1
d /root/lumina-clean-v6 && /usr/bin/pnpm exec next dev --port 3016 > /tmp/nextdev13.log 2>&1
d /root/lumina-clean-v6 && /usr/bin/pnpm exec next dev --port 3017
pkill -f next; true
qwen -- resume
ls
ls --la
ls -la
opencode
qwen
qwen
qwen
qwen
qwen
opencode
opencode
qwen
qwen
qwen
qwen
opencode
ccr code
qwen
qwen
opencode
qwen
# If this fails, replace pip with pip3
pip install -U openai
exit
gemini
qwen
exit
opencode
qwen
exit
qwen
exit
qwen
cmd
x-cmd
ls
aidar
kirocli
kiro
kirocli login
ccr 
ccr model
ccr 
ccr start
ccr
ccr ui
gcloud
gemini
ccr
ccr code
ccr start
ccr model
gemini
geminu
gemini
gemini 
proot-distro login ubuntu
gemini
gemini
gemini
gemini
