"""
Autoresearch Agent System - Autonomous prompt/strategy optimization
"""
import asyncio
import json
import os
import subprocess
import time
import git
import tempfile
import shutil
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import logging
try:
    from opentelemetry import trace
    HAS_OTEL = True
except ImportError:
    HAS_OTEL = False
    trace = None
from pydantic import BaseModel

from core.config import Settings
from core.cache import get_cache_manager
try:
    from observability.tracing import trace_agent_operation
except ImportError:
    def trace_agent_operation(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

logger = logging.getLogger(__name__)
tracer = trace.get_tracer("autoresearch_agent") if HAS_OTEL else None


class ExperimentResult(BaseModel):
    """Result from a single experiment"""
    commit_hash: str
    accuracy: float
    status: str  # keep, discard
    description: str
    timestamp: datetime = datetime.now()
    details: Dict[str, Any] = {}


class AutoresearchAgent:
    """
    Autonomous agent that iteratively optimizes prompts/strategies
    Based on Karpathy's autoresearch pattern
    """
    
    def __init__(self, settings: Settings, agent_id: str = "default"):
        self.settings = settings
        self.agent_id = agent_id
        self.repo_path: Optional[str] = None
        self.results: List[ExperimentResult] = []
        self.is_running = False
        self.current_iteration = 0
        self.best_accuracy = 0.0
        self.baseline_establised = False
        
        logger.info(f"Autoresearch Agent {agent_id} initialized")
    
    def setup_experiment(self, repo_path: str, tag: str, editable_file: str = "prompt.txt",
                        eval_script: str = "evaluate.py", metric_name: str = "accuracy"):
        """
        Setup a new experiment
        
        Args:
            repo_path: Path to the experiment repository
            tag: Experiment tag (e.g., 'prompt-mar5')
            editable_file: The file the agent can modify
            eval_script: Script to evaluate the experiment
            metric_name: Name of the metric to optimize
        """
        self.repo_path = repo_path
        self.editable_file = editable_file
        self.eval_script = eval_script
        self.metric_name = metric_name
        
        # Initialize git repo if needed
        if not os.path.exists(os.path.join(repo_path, ".git")):
            repo = git.Repo.init(repo_path)
        else:
            repo = git.Repo(repo_path)
        
        # Create autoresearch branch
        branch_name = f"autoresearch/{tag}"
        if branch_name not in [b.name for b in repo.branches]:
            repo.git.checkout("-b", branch_name)
        else:
            repo.git.checkout(branch_name)
        
        # Initialize results.tsv if it doesn't exist
        results_file = os.path.join(repo_path, "results.tsv")
        if not os.path.exists(results_file):
            with open(results_file, "w") as f:
                f.write("commit\taccuracy\tstatus\tdescription\n")
        
        logger.info(f"Experiment setup complete: {tag}")
        return branch_name
    
    def run_evaluation(self) -> Optional[float]:
        """
        Run the evaluation script and parse the metric
        
        Returns:
            Metric value (e.g., accuracy) or None if failed
        """
        if not self.repo_path:
            logger.error("No experiment setup")
            return None
        
        try:
            # Run evaluation
            result = subprocess.run(
                ["python", self.eval_script],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=self.settings.AGENT_TIMEOUT
            )
            
            # Parse output
            output = result.stdout + result.stderr
            
            # Save run log
            run_log = os.path.join(self.repo_path, "run.log")
            with open(run_log, "w") as f:
                f.write(output)
            
            # Parse accuracy/metric from output
            # Expected format: "Accuracy: 92.34%" or "Metric: 123.45"
            import re
            match = re.search(rf'{self.metric_name.capitalize()}:?\s*([\d.]+)%?', output, re.IGNORECASE)
            if match:
                metric_value = float(match.group(1))
                logger.info(f"Evaluated {self.metric_name}: {metric_value}")
                return metric_value
            
            logger.warning(f"Could not parse {self.metric_name} from output")
            return None
            
        except subprocess.TimeoutExpired:
            logger.error(f"Evaluation timed out after {self.settings.AGENT_TIMEOUT}s")
            return None
        except Exception as e:
            logger.error(f"Evaluation error: {e}")
            return None
    
    def analyze_failures(self) -> Dict[str, Any]:
        """Analyze failure patterns from last run"""
        last_run_path = os.path.join(self.repo_path, "last_run.json")
        if os.path.exists(last_run_path):
            with open(last_run_path, "r") as f:
                return json.load(f)
        return {}
    
    def generate_hypothesis(self) -> str:
        """
        Generate a hypothesis for the next experiment
        This would use an LLM to suggest changes
        """
        # For now, return a placeholder
        # In production, this would call OpenAI/Anthropic API
        return "Simplify prompt by removing redundant instructions"
    
    def apply_changes(self, hypothesis: str) -> bool:
        """
        Apply changes to the editable file based on hypothesis
        This would use an LLM to generate the actual changes
        """
        try:
            file_path = os.path.join(self.repo_path, self.editable_file)
            
            # Read current content
            with open(file_path, "r") as f:
                current_content = f.read()
            
            # Generate new content (placeholder - would use LLM in production)
            new_content = current_content  # Agent would modify
            
            # Write changes
            with open(file_path, "w") as f:
                f.write(new_content)
            
            # Commit changes
            repo = git.Repo(self.repo_path)
            repo.git.add(self.editable_file)
            repo.git.commit("-m", f"hypothesis: {hypothesis}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to apply changes: {e}")
            return False
    
    async def run_experiment_iteration(self) -> Optional[ExperimentResult]:
        """Run a single iteration of the experiment loop"""
        
        # Generate hypothesis
        hypothesis = self.generate_hypothesis()
        
        # Apply changes
        if not self.apply_changes(hypothesis):
            return None
        
        # Get commit hash
        repo = git.Repo(self.repo_path)
        commit_hash = repo.head.commit.hexsha[:7]
        
        # Run evaluation
        metric_value = self.run_evaluation()
        
        if metric_value is None:
            # Discard commit on evaluation failure
            repo.git.reset("--hard", "HEAD~1")
            result = ExperimentResult(
                commit_hash=commit_hash,
                accuracy=0.0,
                status="discard",
                description=f"Eval failed: {hypothesis}"
            )
        elif metric_value > self.best_accuracy or not self.baseline_establised:
            # Keep if accuracy improved
            self.best_accuracy = metric_value
            self.baseline_establised = True
            result = ExperimentResult(
                commit_hash=commit_hash,
                accuracy=metric_value,
                status="keep",
                description=hypothesis
            )
            logger.info(f"✓ Improved {self.metric_name} to {metric_value}")
        else:
            # Discard if no improvement
            repo.git.reset("--hard", "HEAD~1")
            result = ExperimentResult(
                commit_hash=commit_hash,
                accuracy=metric_value,
                status="discard",
                description=hypothesis
            )
            logger.info(f"✗ No improvement: {metric_value} <= {self.best_accuracy}")
        
        # Log to results.tsv
        results_file = os.path.join(self.repo_path, "results.tsv")
        with open(results_file, "a") as f:
            f.write(f"{result.commit_hash}\t{result.accuracy}\t{result.status}\t{result.description}\n")
        
        self.results.append(result)
        self.current_iteration += 1
        
        # Update metrics
        from observability.metrics import AGENT_ITERATIONS_TOTAL, AGENT_EXPERIMENT_ACCURACY
        AGENT_ITERATIONS_TOTAL.labels(
            agent_name=self.agent_id,
            agent_type="autoresearch",
            status=result.status
        ).inc()
        
        AGENT_EXPERIMENT_ACCURACY.labels(
            agent_name=self.agent_id,
            experiment_id=self.agent_id
        ).set(result.accuracy)
        
        return result
    
    async def run_autonomous_loop(self, max_iterations: Optional[int] = None):
        """
        Run the autonomous experiment loop
        This runs indefinitely until stopped
        """
        max_iterations = max_iterations or self.settings.AGENT_MAX_ITERATIONS
        self.is_running = True
        
        logger.info(f"Starting autonomous loop: max {max_iterations} iterations")
        
        # Establish baseline first
        if not self.baseline_established:
            baseline_accuracy = self.run_evaluation()
            if baseline_accuracy is not None:
                self.best_accuracy = baseline_accuracy
                self.baseline_establised = True
                
                # Log baseline
                repo = git.Repo(self.repo_path)
                commit_hash = repo.head.commit.hexsha[:7]
                
                results_file = os.path.join(self.repo_path, "results.tsv")
                with open(results_file, "a") as f:
                    f.write(f"{commit_hash}\t{baseline_accuracy}\tkeep\tbaseline\n")
                
                logger.info(f"Baseline established: {baseline_accuracy}")
        
        # Main loop
        for iteration in range(max_iterations):
            if not self.is_running:
                logger.info("Agent stopped by user")
                break
            
            try:
                result = await self.run_experiment_iteration()
                
                if result:
                    logger.info(
                        f"Iteration {self.current_iteration}: "
                        f"{result.status} - {result.accuracy} - {result.description}"
                    )
                
                # Small delay between iterations
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in iteration {self.current_iteration}: {e}")
                continue
        
        self.is_running = False
        logger.info(f"Autonomous loop complete. Best {self.metric_name}: {self.best_accuracy}")
    
    def stop(self):
        """Stop the autonomous loop"""
        self.is_running = False
        logger.info("Agent stopping...")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "agent_id": self.agent_id,
            "is_running": self.is_running,
            "current_iteration": self.current_iteration,
            "best_accuracy": self.best_accuracy,
            "baseline_established": self.baseline_establised,
            "results_count": len(self.results),
            "last_results": [r.dict() for r in self.results[-5:]]
        }
    
    def export_results(self) -> str:
        """Export results as TSV string"""
        lines = ["commit\taccuracy\tstatus\tdescription\n"]
        for r in self.results:
            lines.append(f"{r.commit_hash}\t{r.accuracy}\t{r.status}\t{r.description}\n")
        return "".join(lines)


# Agent factory
_agents: Dict[str, AutoresearchAgent] = {}


def create_agent(settings: Settings, agent_id: str) -> AutoresearchAgent:
    """Create a new autoresearch agent"""
    agent = AutoresearchAgent(settings, agent_id)
    _agents[agent_id] = agent
    return agent


def get_agent(agent_id: str) -> Optional[AutoresearchAgent]:
    """Get an existing agent by ID"""
    return _agents.get(agent_id)


def list_agents() -> List[str]:
    """List all agent IDs"""
    return list(_agents.keys())
