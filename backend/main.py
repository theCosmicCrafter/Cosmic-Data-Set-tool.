from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, database

# Create tables (for demo purposes, usually done via Alembic)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Pinnacle Data Platform", version="2026.1.0")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Pinnacle Data Platform (2026 Edition)",
        "status": "operational",
        "features": [
            "Hybrid Vector/Relational Storage",
            "AI-Native Curation",
            "Synthetic Data Foundry"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Projects
@app.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(database.get_db)):
    db_project = models.Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    return projects

# Datasets
@app.post("/datasets/", response_model=schemas.Dataset)
def create_dataset(dataset: schemas.DatasetCreate, db: Session = Depends(database.get_db)):
    db_dataset = models.Dataset(**dataset.dict())
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset

@app.get("/datasets/{dataset_id}", response_model=schemas.Dataset)
def read_dataset(dataset_id: int, db: Session = Depends(database.get_db)):
    dataset = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset
