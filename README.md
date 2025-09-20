# 🚀 EchoPrompt - AI-Powered Prompt Builder

A comprehensive, full-stack application for creating, managing, and sharing AI prompts with advanced features and a beautiful user interface.

![EchoPrompt Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.0.0-green)

## ✨ Features

### 🎯 **Core Functionality**
- **Advanced Prompt Builder** - Create sophisticated prompts with multiple parameters
- **AI-Powered Generation** - Leverage Google Gemini API for intelligent prompt optimization
- **Live Preview** - See your prompts in real-time as you build them
- **Template Management** - Save, load, and organize prompt templates
- **Community Hub** - Share and discover prompts from the community

### 🛠️ **Smart Features**
- **Smart Input Fields** - Autocomplete suggestions for all input fields
- **Keyboard Shortcuts** - Power user shortcuts for faster workflow
- **Error Boundary** - Graceful error handling and recovery
- **Mobile Responsive** - Perfect experience on all devices
- **Real-time Updates** - Community prompts update instantly when you save

### 🎨 **User Experience**
- **Modern UI** - Built with shadcn/ui and Tailwind CSS
- **Glassmorphism Design** - Beautiful, modern interface
- **Dark/Light Mode** - Adaptive theming
- **Accessibility** - WCAG compliant design
- **Performance** - Optimized for speed and efficiency

## 🏗️ **Architecture**

### **Frontend** (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + useState
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **API Client**: Custom service layer

### **Backend** (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based auth
- **AI Integration**: Google Gemini API
- **Security**: Helmet, CORS, Rate limiting

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or Atlas)
- Google Gemini API key

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/Sumit4482/emini-prompt-guide.git
cd emini-prompt-guide
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Environment Setup**
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit backend/.env with your configuration
# Required: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
```

4. **Start the application**
```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

## 📁 **Project Structure**

```
emini-prompt-guide/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── EchoPrompt/           # Core components
│   │   │   ├── PromptBuilder.tsx # Main prompt builder
│   │   │   ├── CommunityHub.tsx  # Community features
│   │   │   ├── BeginnerTemplates.tsx # Template library
│   │   │   └── ...               # Other components
│   │   └── ui/                   # shadcn/ui components
│   ├── pages/                    # Page components
│   ├── contexts/                 # React contexts
│   ├── services/                 # API services
│   └── hooks/                    # Custom hooks
├── backend/                      # Backend source
│   ├── src/
│   │   ├── models/               # Database models
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Express middleware
│   │   └── services/             # Business logic
│   └── dist/                     # Compiled TypeScript
├── public/                       # Static assets
└── docs/                         # Documentation
```

## 🔧 **Configuration**

### **Environment Variables**

Create `backend/.env` with the following:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/emini-prompt-guide

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=3001
NODE_ENV=development
```

### **API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/prompts` | Get user prompts |
| POST | `/api/prompts` | Save new prompt |
| GET | `/api/templates` | Get templates |
| POST | `/api/templates` | Save template |
| POST | `/api/generate` | Generate AI prompt |

## 🎮 **Usage**

### **Creating Prompts**
1. Navigate to the **Builder** tab
2. Fill in the prompt parameters:
   - **Role**: Who should the AI act as?
   - **Task**: What should it do?
   - **Context**: Additional background information
   - **Tone**: Desired communication style
   - **Output Format**: How should it respond?
3. Use **AI Generate** for intelligent optimization
4. **Save** your prompt for future use

### **Using Templates**
1. Go to **Templates** tab
2. Browse beginner-friendly templates
3. Click **Use** to load into builder
4. Customize as needed

### **Community Features**
1. Visit **Community** tab
2. Browse shared prompts
3. **Use** prompts from others
4. Your saved prompts automatically appear here

### **Keyboard Shortcuts**
- `Ctrl/Cmd + Enter`: Generate prompt
- `Ctrl/Cmd + S`: Save prompt
- `Ctrl/Cmd + T`: Save as template
- `Ctrl/Cmd + L`: Load template
- `Ctrl/Cmd + A`: Toggle advanced settings
- `Ctrl/Cmd + F`: Focus task field

## 🚀 **Deployment**

### **Frontend (Netlify)**
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

### **Backend (Render)**
1. Connect your GitHub repository to Render
2. Set build command: `cd backend && npm install && npm run build`
3. Set start command: `cd backend && npm start`
4. Add environment variables in Render dashboard

### **Database (MongoDB Atlas)**
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

## 🧪 **Testing**

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend
npm test

# Run all tests
npm run test:all
```

## 📚 **Documentation**

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Backend Setup](BACKEND_SETUP.md)
- [MongoDB Setup](MONGODB_SETUP.md)
- [Environment Variables](ENVIRONMENT_VARIABLES.md)
- [Project Summary](PROJECT_SUMMARY.md)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [React](https://reactjs.org/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend

## 📞 **Support**

If you have any questions or need help:

1. Check the [Issues](https://github.com/Sumit4482/emini-prompt-guide/issues) page
2. Create a new issue with detailed description
3. Join our community discussions

---

**Made with ❤️ by the Sumit4482 and Cursor AI**

*Empowering everyone to create better AI prompts*