from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import os
from models import Script, ExecutionRequest
from executor import executor
from scheduler import ScriptScheduler

app = FastAPI()

DATA_PATH = "data/scripts.json"
scheduler = ScriptScheduler(DATA_PATH)

@app.on_event("startup")
async def startup_event():
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

# --- API Endpoints ---

@app.get("/api/scripts")
async def get_scripts():
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.post("/api/scripts")
async def save_scripts(scripts: list[Script]):
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

# --- Static Files ---

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
