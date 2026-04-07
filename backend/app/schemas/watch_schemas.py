from pydantic import BaseModel

class StartRequest(BaseModel):
    directory: str