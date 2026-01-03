from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    version: Optional[str] = "v1"

class DatasetCreate(DatasetBase):
    project_id: int

class Dataset(DatasetBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DataPointBase(BaseModel):
    uri: str
    metadata_json: Optional[Any] = None
    quality_score: Optional[float] = None

class DataPointCreate(DataPointBase):
    embedding: List[float] # Input vector

class DataPoint(DataPointBase):
    id: int
    dataset_id: int

    class Config:
        from_attributes = True
