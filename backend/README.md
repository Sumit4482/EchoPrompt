# EchoPrompt Backend API

A robust Node.js backend API for the EchoPrompt AI Prompt Generator application, built with Express.js, TypeScript, and MongoDB.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Template Management**: CRUD operations for prompt templates with categories and tags
- **Prompt Generation**: Advanced prompt generation with optimization and AI enhancement
- **Analytics**: Comprehensive analytics and usage tracking
- **Search**: Full-text search across templates and prompts
- **Export**: Multiple export formats (TXT, JSON, Markdown, CSV)
- **Rate Limiting**: Built-in protection against abuse
- **Data Validation**: Comprehensive input validation and sanitization

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Morgan

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emini-prompt-guide/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/echoprompt
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Register User
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

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com", // email or username
  "password": "securePassword123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Template Endpoints

#### Get Templates
```http
GET /api/templates?page=1&limit=10&category=Technical Writing&search=code
```

#### Create Template
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

#### Get Single Template
```http
GET /api/templates/:id
```

#### Update Template
```http
PUT /api/templates/:id
Authorization: Bearer <jwt_token>
```

#### Delete Template
```http
DELETE /api/templates/:id
Authorization: Bearer <jwt_token>
```

### Prompt Endpoints

#### Generate Prompt
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

#### Get User's Prompts
```http
GET /api/prompts?page=1&limit=10&sort=createdAt&order=desc
Authorization: Bearer <jwt_token>
```

#### Export Prompt
```http
POST /api/prompts/:id/export
Content-Type: application/json

{
  "format": "markdown" // txt, json, markdown, csv
}
```

### Analytics Endpoints

#### Platform Overview
```http
GET /api/analytics/overview
```

#### Trending Content
```http
GET /api/analytics/trending?period=7d&limit=10
```

#### User Insights
```http
GET /api/analytics/user-insights?period=30d
Authorization: Bearer <jwt_token>
```

### User Endpoints

#### User Statistics
```http
GET /api/users/stats
Authorization: Bearer <jwt_token>
```

#### User Activity
```http
GET /api/users/activity?page=1&limit=20&type=all
Authorization: Bearer <jwt_token>
```

#### Export User Data
```http
GET /api/users/export
Authorization: Bearer <jwt_token>
```

## 🗄️ Database Schema

### User Model
- Basic profile information (email, username, name)
- Preferences (theme, default settings)
- Subscription details
- Usage statistics

### Template Model
- Template metadata (name, description, category)
- Prompt data structure
- Public/private visibility
- Usage count and ratings

### Prompt Model
- Generated prompt content
- Associated template reference
- Metadata (optimization, AI enhancement)
- Analytics (views, copies, exports)

### Analytics Model
- Event tracking
- User behavior analytics
- Usage patterns

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with configurable rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js security headers

## 📊 Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Validation errors array"] // Optional
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🧪 Testing

Run tests:
```bash
npm test
```

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=<production_mongodb_uri>
   JWT_SECRET=<secure_production_secret>
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@echoprompt.com or open an issue on GitHub.

## 🔗 Related

- [Frontend Repository](../README.md)
- [API Documentation](http://localhost:3001/api)
- [Health Check](http://localhost:3001/health)
