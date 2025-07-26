# FileVault: Modern File Transfer Vault

A production-ready, fullstack file vault system (like Google Drive) built with Flask, React, PostgreSQL, and MinIO. Supports group accounts, large file uploads, and secure sharing.

## Features
- User & group authentication (JWT)
- Upload/download files & folders (large file support)
- Group accounts (shared vaults)
- Scalable object storage (MinIO/S3)
- Modern React frontend (Material-UI)
- Production-ready Docker deployment

## Tech Stack
- Flask (Python, REST API)
- React (frontend)
- PostgreSQL (metadata)
- MinIO (file storage)
- Docker Compose (orchestration)

## Quick Start
1. Clone the repo
2. Copy `.env.example` to `.env` in backend and frontend, fill secrets
3. Run `docker-compose up --build`
4. Access frontend at `localhost:3000`, backend at `localhost:5000`

## Deployment
- See full instructions in the `README.md` after scaffolding is complete. 