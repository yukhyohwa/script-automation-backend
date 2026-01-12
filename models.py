from pydantic import BaseModel
from typing import Optional, List

class Script(BaseModel):
    id: str
    name: str
    path: str
    params: Optional[str] = ""
    schedule: Optional[str] = ""
    enabled: bool = True

class ExecutionRequest(BaseModel):
    script_ids: List[str]
    custom_params: Optional[str] = None
