from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import json
import os
from executor import executor

class ScriptScheduler:
    def __init__(self, data_path: str):
        self.scheduler = BackgroundScheduler()
        self.data_path = data_path
        self.jobs = {}

    def start(self):
        self.scheduler.start()
        self.reload_jobs()

    def reload_jobs(self):
        # Remove existing jobs managed by this class
        for job_id in list(self.jobs.keys()):
            try:
                self.scheduler.remove_job(job_id)
            except:
                pass
        self.jobs = {}

        if os.path.exists(self.data_path):
            with open(self.data_path, 'r', encoding='utf-8') as f:
                scripts = json.load(f)
                for s in scripts:
                    if s.get("schedule") and s.get("enabled"):
                        try:
                            job = self.scheduler.add_job(
                                executor.run_script,
                                CronTrigger.from_crontab(s["schedule"]),
                                args=[s["id"], s["path"], s.get("params", "")]
                            )
                            self.jobs[s["id"]] = job.id
                        except Exception as e:
                            print(f"Error scheduling job {s['id']}: {e}")

    def shutdown(self):
        self.scheduler.shutdown()

# We will initialize this in main.py
