import subprocess
import os
import threading
from datetime import datetime

class ScriptExecutor:
    def __init__(self):
        self.logs = {}

    def run_script(self, script_id: str, script_path: str, params: str = ""):
        def target():
            try:
                start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                self.logs[script_id] = f"[{start_time}] Starting script...\n"
                
                args = ["python", script_path]
                if params:
                    args.extend(params.split())
                
                process = subprocess.Popen(
                    args,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    cwd=os.path.dirname(script_path)
                )
                
                for line in process.stdout:
                    self.logs[script_id] += line
                
                process.wait()
                end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                self.logs[script_id] += f"\n[{end_time}] Script finished with code {process.returncode}\n"
            except Exception as e:
                self.logs[script_id] = f"Error: {str(e)}"

        thread = threading.Thread(target=target)
        thread.start()
        return {"status": "started", "script_id": script_id}

    def get_logs(self, script_id: str):
        return self.logs.get(script_id, "No logs found.")

executor = ScriptExecutor()
