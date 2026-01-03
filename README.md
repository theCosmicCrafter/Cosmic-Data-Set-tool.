# Pinnacle Data Platform

**The OS for Data-Centric AI (2026 Edition)**

Pinnacle is a unified platform for creating, curating, and organizing datasets for the next generation of AI. It moves beyond simple labeling to encompass the entire lifecycle of data production: **Semantic Curation**, **Synthetic Generation**, and **Observability**.

## 🚀 Vision

In 2026, the competitive advantage is no longer just the model, but the **data**. Pinnacle is built on three core pillars:

1.  **AI-Native Curation**: Don't label everything. Use embeddings (Vector Search) to find the most valuable "high-entropy" data points.
2.  **Synthetic Foundry**: Missing data? Generate it. Integrated pipelines for LLM/Diffusion-based data synthesis.
3.  **Observability First**: Treat data like code. Automated "Health Cards" for every dataset version (drift, bias, quality scores).

## 🛠️ Stack

*   **Backend**: Python / FastAPI / SQLAlchemy / Pydantic
*   **Database**: PostgreSQL 16 + `pgvector` (Hybrid Relational + Semantic Search)
*   **Frontend**: Next.js 14 / TypeScript / Tailwind CSS
*   **Infrastructure**: Docker Compose

## ⚡ Quick Start

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/pinnacle-data-platform.git
    cd pinnacle-data-platform
    ```

2.  **Run the stack**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the services**:
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)
    *   **Database**: `localhost:5432`

## 📖 Documentation

See [DESIGN.md](./DESIGN.md) for a deep dive into the 2026 architecture and roadmap.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
