# Product Requirements Document (PRD): Pinnacle Data Platform

**Version:** 1.0
**Date:** 2026-01-01
**Status:** Draft
**Target Release:** 2026.1

---

## 1. Executive Summary

The **Pinnacle Data Platform** is the operating system for Data-Centric AI. As model architectures converge (Transformers/Mamba), the primary differentiator for AI performance in 2026 is the quality, diversity, and curation of data.

Current tools treat data as static assets to be labeled. Pinnacle treats data as a dynamic resource to be **curated, synthesized, and observed**. It combines a hybrid vector-relational database with generative AI pipelines to allow teams to find edge cases ("unknown unknowns") and fill them with synthetic data.

## 2. Problem Statement

*   **Data Deluge**: Teams have petabytes of raw data but cannot find the 1% that matters for model training.
*   **Edge Case Failure**: Models fail in production on rare scenarios (e.g., "heavy fog at night") that are underrepresented in training data.
*   **Manual Bottlenecks**: Creating new datasets requires expensive human annotation loops that take weeks.
*   **Lack of Visibility**: Dataset versioning exists (DVC), but "Dataset Observability" (knowing *what* is inside the version) is missing.

## 3. Goals & Objectives

*   **Reduce Curation Time by 10x**: Allow users to query data semantically (e.g., "Find all images of scratched metal") instead of visually scanning.
*   **Eliminate Data Gaps**: Provide a "one-click" workflow to generate synthetic data for underrepresented classes.
*   **Ensure Reproducibility**: Every model training run must be traceable back to an immutable, statistically profiled dataset version.

## 4. User Personas

1.  **The ML Engineer (Alex)**: Focuses on model performance. Needs to quickly find why the model failed on a specific edge case and create a dataset to fix it.
2.  **The Data Curator (Sam)**: Responsible for data quality. Needs tools to explore massive datasets, identify duplicates/outliers, and manage labeling budgets.
3.  **The Head of AI (Jordan)**: Cares about governance and cost. Needs dashboards showing dataset growth, annotation costs, and ROI.

## 5. Functional Requirements

### 5.1 AI-Native Curation & Search
*   **FR-1.1 Auto-Embedding**: The system MUST automatically generate vector embeddings (via CLIP/SigLIP/LLM) for all uploaded assets.
*   **FR-1.2 Semantic Search**: Users MUST be able to search data using natural language queries (e.g., "people wearing safety vests").
*   **FR-1.3 Visual Clustering**: The UI MUST provide a 2D/3D projection (UMAP/t-SNE) of the dataset to visualize clusters and outliers.
*   **FR-1.4 Similarity Search**: Users MUST be able to select a "Gold Standard" image and find the nearest neighbors in the unlabeled pool.

### 5.2 Synthetic Data Foundry
*   **FR-2.1 Generative Prompting**: Users MUST be able to define prompts to generate new data points (e.g., "Generate 100 variations of this invoice with different layouts").
*   **FR-2.2 Style Transfer**: The system SHOULD support style transfer (e.g., "Make these sunny driving images look like it's raining").
*   **FR-2.3 Review Queue**: Generated data MUST go into a "Pending Review" state before merging into the main dataset.

### 5.3 Data Observability (The "Health Card")
*   **FR-3.1 Automated Profiling**: Upon version creation, the system MUST compute statistics: Class distribution, embedding drift, brightness/contrast (for images), token length (for text).
*   **FR-3.2 Bias Detection**: The system SHOULD flag potential biases (e.g., "Class 'Pedestrian' is 90% correlated with 'Daytime'").
*   **FR-3.3 Drift Alerting**: Users MUST be alerted if a new dataset version significantly deviates statistically from the previous version.

### 5.4 Data Management & Versioning
*   **FR-4.1 Immutable Versions**: Once a version is published, it CANNOT be modified.
*   **FR-4.2 Hybrid Querying**: Support complex queries mixing SQL and Vector Search (e.g., `WHERE date > '2025-01-01' AND embedding_similarity(query) > 0.8`).
*   **FR-4.3 Lineage**: The system MUST track the origin of every data point (Real vs. Synthetic, Source Batch ID).

## 6. Non-Functional Requirements

*   **NFR-1 Scalability**: Support up to 100 Million data points with <200ms query latency on semantic search.
*   **NFR-2 Privacy**: Synthetic generation MUST NOT leak PII (Personally Identifiable Information) from the seed data.
*   **NFR-3 Integration**: MUST expose a Python SDK compatible with PyTorch/TensorFlow data loaders.
*   **NFR-4 Usability**: The UI MUST support Dark Mode (because engineers love it).

## 7. User Stories

| ID | Persona | Story | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **US-1** | ML Engineer | As Alex, I want to find "foggy" images in my unlabeled pool so I can retrain my model to fix a production bug. | I type "foggy road" in the search bar and get relevant results ranked by similarity. |
| **US-2** | Data Curator | As Sam, I want to see a graph of my dataset so I can spot outliers that might be garbage data. | I see a 2D scatter plot where I can hover over points to see previews. |
| **US-3** | ML Engineer | As Alex, I want to generate 500 synthetic images of "drones in the sky" because I only have 10 real ones. | I provide a prompt and 10 seed images; the system returns 500 new variations. |
| **US-4** | Head of AI | As Jordan, I want to know if the new dataset version introduces class imbalance. | I view the "Health Card" diff and see a warning that "Class B" dropped by 20%. |

## 8. Roadmap & Phasing

### Phase 1: Foundation (Q1 2026)
*   Core Dataset/Project Management.
*   Upload & Storage (Local/S3).
*   Basic Semantic Search (Text-to-Image).
*   SDK for upload/download.

### Phase 2: Intelligence (Q2 2026)
*   Visual Clustering (UMAP).
*   Synthetic Data Integration (External API hooks).
*   "Health Card" v1 (Basic stats).

### Phase 3: Automation (Q3 2026)
*   Active Learning Loops (Model-in-the-loop).
*   Advanced Synthetic Pipelines (Fine-tuning generation models).
*   Edge Device Sync.

## 9. Assumptions & Risks

*   **Risk**: Generative models may hallucinate unrealistic features in synthetic data.
    *   *Mitigation*: Mandatory "Human-in-the-loop" review stage for synthetic batches.
*   **Risk**: Vector search at 100M+ scale requires significant RAM/Compute.
    *   *Mitigation*: Use HNSW indexing in `pgvector` and horizontal scaling of Read Replicas.
*   **Assumption**: Users have access to GPU resources for local embedding generation, or are willing to pay for API-based embeddings.
