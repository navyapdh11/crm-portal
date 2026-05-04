"""
Example evaluate.py for autoresearch experiments
This is a template that you should adapt to your specific use case
"""
import json
import sys
from pathlib import Path


def load_eval_set(path: str = "eval_set.jsonl") -> list:
    """Load evaluation dataset"""
    eval_set = []
    with open(path, 'r') as f:
        for line in f:
            if line.strip():
                eval_set.append(json.loads(line))
    return eval_set


def load_prompt(path: str = "prompt.txt") -> str:
    """Load current prompt"""
    with open(path, 'r') as f:
        return f.read()


def evaluate_example(example: dict, prompt: str) -> bool:
    """
    Evaluate a single example
    
    This is where you'd call your LLM with the prompt
    and check if the response matches the expected output
    
    For this template, we'll use a simple heuristic
    """
    # In production, you would:
    # 1. Call LLM API with the prompt + example input
    # 2. Parse the response
    # 3. Compare with expected output
    
    # Placeholder: return True if prompt contains certain keywords
    required_keywords = example.get("required_keywords", [])
    for keyword in required_keywords:
        if keyword not in prompt:
            return False
    return True


def main():
    """Main evaluation function"""
    eval_set = load_eval_set()
    prompt = load_prompt()
    
    correct = 0
    total = len(eval_set)
    
    for example in eval_set:
        if evaluate_example(example, prompt):
            correct += 1
    
    accuracy = (correct / total * 100) if total > 0 else 0
    
    print(f"Accuracy: {accuracy:.2f}% ({correct}/{total} examples correct)")
    
    # Optionally save detailed results
    results = {
        "accuracy": accuracy,
        "correct": correct,
        "total": total,
        "examples": []
    }
    
    with open("last_run.json", 'w') as f:
        json.dump(results, f, indent=2)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
