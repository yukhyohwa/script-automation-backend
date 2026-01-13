from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import os
from app.models.schemas import Script, ExecutionRequest
from app.core.executor import executor
from app.core.scheduler import ScriptScheduler

app = FastAPI(title="Script Automation Backend")

# In a professional setup, paths are often handled by a config module
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "scripts.json")
STATIC_DIR = os.path.join(BASE_DIR, "static")

scheduler = ScriptScheduler(DATA_PATH)

@app.on_event("startup")
async def startup_event():
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

@app.get("/api/scripts")
async def get_scripts():
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.post("/api/scripts")
async def save_scripts(scripts: list[Script]):
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump([s.dict() for s in scripts], f, indent=4, ensure_ascii=False)
    scheduler.reload_jobs()
    return {"status": "success"}

@app.post("/api/execute")
async def execute_scripts(req: ExecutionRequest):
    scripts = await get_scripts()
    script_map = {s["id"]: s for s in scripts}
    
    results = []
    for sid in req.script_ids:
        if sid in script_map:
            s = script_map[sid]
            params = req.custom_params if req.custom_params is not None else s.get("params", "")
            res = executor.run_script(sid, s["path"], params)
            results.append(res)
        else:
            results.append({"status": "error", "script_id": sid, "message": "Not found"})
    
    return results

@app.get("/api/logs/{script_id}")
async def get_logs(script_id: str):
    return {"logs": executor.get_logs(script_id)}

@app.get("/api/reports/{script_id}")
async def list_reports(script_id: str):
    scripts = await get_scripts()
    script = next((s for s in scripts if s["id"] == script_id), None)
    if not script or not script.get("report_dir"):
        return []
    
    report_dir = script["report_dir"]
    if not os.path.exists(report_dir):
        return []
    
    files = []
    for f in os.listdir(report_dir):
        if os.path.isfile(os.path.join(report_dir, f)):
            files.append({
                "name": f,
                "mtime": os.path.getmtime(os.path.join(report_dir, f)),
                "size": os.path.getsize(os.path.join(report_dir, f))
            })
    # Sort by mtime descending (newest first)
    files.sort(key=lambda x: x["mtime"], reverse=True)
    return files

@app.get("/api/reports/{script_id}/{filename}")
async def get_report_file(script_id: str, filename: str):
    scripts = await get_scripts()
    script = next((s for s in scripts if s["id"] == script_id), None)
    if not script or not script.get("report_dir"):
        raise HTTPException(status_code=404, detail="Script or report directory not found")
    
    file_path = os.path.join(script["report_dir"], filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
