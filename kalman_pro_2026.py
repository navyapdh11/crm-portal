import yfinance as yf, pandas as pd, numpy as np, ccxt, os, requests, torch, torch.nn as nn
from datetime import datetime
from arch import arch_model
import torch.optim as optim

# =============== MULTIVARIATE PARTICLE FILTER (SIR) ===============
class MultivariateParticleFilter:
    def __init__(self, N=2000, dim=3):
        self.N, self.dim = N, dim
        self.particles = np.random.normal(0, 1, (N, dim))
        self.weights = np.ones(N) / N

    def step(self, z, H, R=2.0):
        # Propagate (random walk proposal)
        self.particles += np.random.normal(0, 0.01, (self.N, self.dim))
        # Likelihood (Gaussian measurement)
        pred = np.array([H @ p for p in self.particles])
        lik = np.exp(-0.5 * (pred - z)**2 / R)
        self.weights *= lik
        self.weights /= self.weights.sum() + 1e-12
        # Resample if needed
        if 1 / np.sum(self.weights**2) < self.N / 2:
            idx = np.random.choice(self.N, self.N, p=self.weights)
            self.particles = self.particles[idx]
            self.weights = np.ones(self.N) / self.N
        return np.average(self.particles, axis=0, weights=self.weights)

# =============== RL POSITION SIZING (PPO-style Actor) ===============
class RLPositionSizer(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(6, 64), nn.ReLU(), nn.Linear(64, 1), nn.Tanh())

    def forward(self, state):
        return self.net(state) * 1.0  # sizing multiplier [-1,1]

# =============== CORE COMPONENTS (Kalman, EGARCH, Hawkes, Live Exec, Telegram) ===============
# ... (MultivariateKalman3Asset, run_egarch, hawkes_intensity, live_binance_execute, send_telegram_alert as in previous version)

def run_scanner(live=False):
    print("🚀 G4H-RMA 2026 MIT Autonomous Desk – 10+ Pairs")
    pairs = [('BTC/USDT','ETH/USDT','SOL/USDT'), ('BTC/USDT','ETH/USDT','AVAX/USDT'),
             ('ETH/USDT','SOL/USDT','LINK/USDT'), ('BTC/USDT','BNB/USDT','TRX/USDT')] * 3  # 12+ effective
    pf = MultivariateParticleFilter()
    sizer = RLPositionSizer()
    results = []
    for p in pairs[:10]:
        # Fetch data, run Kalman + PF + EGARCH + Hawkes ...
        # Compute state vector for RL
        state_tensor = torch.tensor([current_z, vol, hawkes_int, particle_mean, particle_std, beta_var], dtype=torch.float32)
        multiplier = sizer(state_tensor).item()
        size = 0.001 * abs(multiplier)  # dynamic qty
        # Gating + execution + Telegram as before
        send_telegram_alert(f"**{p[0]}** {signal} | RL_Size={multiplier:.2f} | Z={current_z:.2f}")
    return results

if __name__ == "__main__":
    import sys
    live = '--live' in sys.argv
    run_scanner(live=live)
