import torch
import sys
import os

# Ensure the project can import openmythos
sys.path.append("/root/openmythos")

from openmythos.model import apply_rotary_emb

def test_rope_alignment():
    test_cases = [
        {"batch": 1, "t_q": 1, "t_k": 1},
        {"batch": 8, "t_q": 128, "t_k": 256},
    ]
    for case in test_cases:
        batch, t_q, t_k = case["batch"], case["t_q"], case["t_k"]
        num_heads = 4
        head_dim = 16
        
        xq = torch.randn(batch, t_q, num_heads, head_dim)
        xk = torch.randn(batch, t_k, num_heads, head_dim)
        max_len = max(t_q, t_k) + 10
        freqs_cis = torch.randn(1, max_len, 1, head_dim // 2, dtype=torch.complex64)
        
        try:
            xq_out, xk_out = apply_rotary_emb(xq, xk, freqs_cis)
            assert xq_out.shape == xq.shape
            assert xk_out.shape == xk.shape
            print(f"Case {case}: Success")
        except Exception as e:
            print(f"Case {case}: Failure: {e}")

if __name__ == "__main__":
    test_rope_alignment()
