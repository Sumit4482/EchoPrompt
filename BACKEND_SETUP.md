# EchoPrompt - Complete Setup Guide

This guide will help you set up both the frontend and backend for the EchoPrompt AI Prompt Generator.

## 📁 Project Structure

```
emini-prompt-guide/
├── src/                    # Frontend (React + TypeScript)
├── backend/               # Backend API (Node.js + Express)
├── package.json          # Frontend dependencies
└── README.md            # Original frontend README
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your configuration
# At minimum, set these values:
# PORT=3001
# NODE_ENV=development
# MONGODB_URI=mongodb://localhost:27017/echoprompt
# JWT_SECRET=your-secret-key-here
# CORS_ORIGIN=http://localhost:5173
```

**Environment Variables (backend/.env):**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/echoprompt

# JWT
JWT_SECRET=echoprompt-super-secret-jwt-key-for-development-only
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
```

**Start MongoDB:**
```bash
# Install MongoDB if not already installed
# On macOS with Homebrew:
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# On Ubuntu:
sudo systemctl start mongod

# On Windows:
# Start MongoDB service from Services or run mongod.exe
```

**Start Backend Server:**
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The backend API will be available at `http://localhost:3001`

### 2. Frontend Setup

```bash
# Navigate to root directory
cd ..

# Install frontend dependencies
npm install

# Start frontend development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Backend API Features

### Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcryptjs
- User profile management

### Template Management
- Create, read, update, delete templates
- Public/private template visibility
- Category and tag-based organization
- Usage tracking and ratings

### Prompt Generation
- Generate prompts from templates or custom data
- Prompt optimization
- Multiple export formats (TXT, JSON, Markdown, CSV)
- Analytics tracking

### Search & Discovery
- Full-text search across templates
- Category and tag filtering
- Trending templates
- User leaderboards

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login User**
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "securePassword123"
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Template Endpoints

**Get Templates**
```http
GET /api/templates?page=1&limit=10&category=Technical Writing
```

**Create Template**
```http
POST /api/templates
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Code Review Template",
  "description": "Template for reviewing code",
  "promptData": {
    "role": "Senior Software Engineer",
    "task": "Review the following code for best practices",
    "context": "Code review for production deployment",
    "tone": "Professional",
    "outputFormat": "Markdown"
  },
  "category": "Technical Writing",
  "tags": ["code", "review", "programming"],
  "isPublic": true
}
```

### Prompt Generation

**Generate Prompt**
```http
POST /api/prompts/generate
Content-Type: application/json

{
  "promptData": {
    "role": "Technical Writer",
    "task": "Write documentation for a REST API",
    "context": "Node.js Express API with MongoDB",
    "tone": "Professional",
    "outputFormat": "Markdown",
    "audience": "Developers",
    "complexity": "Intermediate"
  },
  "optimize": true
}
```

## 🔗 Connecting Frontend to Backend

The frontend is already configured to work with the backend. The key integration points are:

1. **API Base URL**: Frontend expects backend at `http://localhost:3001/api`
2. **Authentication**: JWT tokens stored in localStorage
3. **CORS**: Backend configured to allow requests from `http://localhost:5173`

### Frontend Updates Needed

To fully integrate the frontend with the new backend, you'll need to:

1. **Add API Service Layer**
2. **Implement Authentication State Management**
3. **Update Template Management**
4. **Connect Prompt Generation to Backend**

Example API service:

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async generatePrompt(promptData: any) {
    const response = await fetch(`${API_BASE_URL}/prompts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ promptData, optimize: true }),
    });
    return response.json();
  }

  async getTemplates() {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async saveTemplate(template: any) {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(template),
    });
    return response.json();
  }
}

export const apiService = new ApiService();
```

## 🗄️ Database Schema

The backend uses MongoDB with the following collections:

### Users
- User profiles and authentication
- Preferences and subscription info
- Usage statistics

### Templates
- Prompt templates with metadata
- Category and tag organization
- Usage tracking and ratings

### Prompts
- Generated prompts with analytics
- Export history and user ratings

### Analytics
- Event tracking and usage patterns
- User behavior analytics

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcryptjs
- **Rate Limiting** to prevent abuse
- **Input Validation** with express-validator
- **CORS Protection** with configurable origins
- **Security Headers** via Helmet.js

## 🚀 Deployment

### Backend Deployment

1. **Build the backend**
   ```bash
   cd backend
   npm run build
   ```

2. **Set production environment variables**
3. **Deploy to your preferred platform** (Heroku, AWS, DigitalOcean, etc.)

### Frontend Deployment

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Deploy to static hosting** (Vercel, Netlify, AWS S3, etc.)
3. **Update API_BASE_URL** to point to your production backend

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env file

2. **CORS Errors**
   - Verify CORS_ORIGIN in backend .env matches frontend URL

3. **Authentication Issues**
   - Check JWT_SECRET is set in backend .env
   - Verify token is being sent in Authorization header

4. **Port Conflicts**
   - Backend default: 3001
   - Frontend default: 5173
   - Change ports in respective configs if needed

### Health Checks

- Backend health: `http://localhost:3001/health`
- API docs: `http://localhost:3001/api`
- Frontend: `http://localhost:5173`

## 📞 Support

For issues or questions:
1. Check the logs in the terminal
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check MongoDB is running and accessible

The backend provides comprehensive logging to help debug issues. Check the console output for detailed error messages.
