
# LoRAForge: AI-Enhanced Dataset Studio

LoRAForge is a comprehensive, AI-enhanced platform for multi-modal dataset curation and management, specifically optimized for LoRA fine-tuning of generative AI models.

## Architecture

- **Frontend**: Next.js (React), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **Database**: PostgreSQL
- **Task Queue**: Celery with Redis
- **Workers**: Python-based ML workers for image/video processing

## Setup

1. **Prerequisites**: Docker and Docker Compose installed.
2. **Environment**: Copy `.env.example` to `.env` (handled automatically in dev).
3. **Run**:
   ```bash
   docker-compose up --build
   ```

## Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Db Admin (Optional)**: Connect to localhost:5432
