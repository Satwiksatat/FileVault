# FileVault - Modern File Transfer Vault

A secure, modern file sharing and management system built with React, Flask, and PostgreSQL.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with role-based access control
- 📁 **File Management**: Upload, download, and organize files with versioning
- 👥 **Group Collaboration**: Create groups and share files with team members
- 📊 **Dashboard Analytics**: Track usage statistics and file activity
- 🐳 **Docker Support**: Easy deployment with Docker Compose
- 🔍 **Search & Filter**: Advanced search and filtering capabilities
- 📱 **Responsive Design**: Modern UI built with Material-UI

## Tech Stack

### Backend
- **Flask**: Python web framework
- **PostgreSQL**: Primary database
- **MinIO**: Object storage for files
- **JWT**: Authentication tokens
- **SQLAlchemy**: ORM for database operations

### Frontend
- **React**: JavaScript framework
- **Material-UI**: Component library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **React Dropzone**: File upload handling

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd FileVault
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- MinIO Console: http://localhost:9001

### Local Development

1. Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export FLASK_APP=app:create_app()
flask run
```

2. Frontend Setup:
```bash
cd frontend
npm install
npm start
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile

### File Management
- `GET /api/files` - List user files
- `POST /api/files/upload` - Upload file
- `GET /api/files/<id>/download` - Download file
- `DELETE /api/files/<id>` - Delete file

### Group Management
- `GET /api/groups` - List user groups
- `POST /api/groups` - Create group
- `PUT /api/groups/<id>` - Update group
- `DELETE /api/groups/<id>` - Delete group

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://filevault:filevaultpass@db:5432/filevault
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadminpass
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_NAME=FileVault
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 