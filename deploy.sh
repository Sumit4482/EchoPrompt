#!/bin/bash

# EchoPrompt Deployment Script
# This script helps you deploy your application to free platforms

echo "🚀 EchoPrompt Deployment Script"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Your commit message'"
    exit 1
fi

echo "✅ Git repository is clean and ready for deployment"
echo ""

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo ""
echo "🎯 Deployment Options:"
echo "1. Vercel (Frontend) + Render (Backend) + MongoDB Atlas (Database)"
echo "2. Netlify (Frontend) + Render (Backend) + MongoDB Atlas (Database)"
echo "3. All-in-One on Render"
echo ""

echo "📋 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "3. Set up your environment variables:"
echo "   - VITE_API_URL (for frontend)"
echo "   - MONGODB_URI (for backend)"
echo "   - JWT_SECRET (for backend)"
echo "   - GEMINI_API_KEY (for backend)"
echo ""

echo "🎉 Ready to deploy! Check DEPLOYMENT_GUIDE.md for detailed instructions."
