import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure environment variables for ZCode GLM-4.7 API
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["LLM_MODEL"] = "openai/glm-4.7"
os.environ["OPENAI_BASE_URL"] = "https://api.z.ai/api/coding/paas/v4"
if "ZAI_API_KEY" in os.environ and "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = os.environ["ZAI_API_KEY"]

from yunta.cli import load_system_prompt
from yunta.provider import LiteLLMProvider
from yunta.agent import Agent

def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/yunta_runner.py 'tu instrucción'")
        sys.exit(1)

    prompt = " ".join(sys.argv[1:]).strip()
    system = load_system_prompt()
    provider = LiteLLMProvider(system=system)
    
    # Auto-approve tool executions in headless agentic harness
    agent = Agent(provider=provider, system=system, confirm=lambda name, detail: True)
    agent.send(prompt)

if __name__ == "__main__":
    main()
