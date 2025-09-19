import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Template } from '../models/Template';
import { Prompt } from '../models/Prompt';
import User from '../models/User';

// Sample users
const sampleUsers = [
  {
    _id: new mongoose.Types.ObjectId(),
    email: 'john@example.com',
    username: 'johnsmith',
    firstName: 'John',
    lastName: 'Smith',
    password: 'hashedpassword123', // In real app, this would be properly hashed
    preferences: {
      theme: 'dark',
      defaultLanguage: 'English',
      defaultTone: 'Professional',
      defaultOutputFormat: 'Markdown'
    },
    subscription: {
      plan: 'pro',
      status: 'active'
    },
    usage: {
      promptsGenerated: 45,
      templatesCreated: 8,
      lastActivity: new Date()
    }
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: 'sarah@example.com',
    username: 'sarahdev',
    firstName: 'Sarah',
    lastName: 'Developer',
    password: 'hashedpassword456',
    preferences: {
      theme: 'light',
      defaultLanguage: 'English',
      defaultTone: 'Casual',
      defaultOutputFormat: 'Plain Text'
    },
    subscription: {
      plan: 'free',
      status: 'active'
    },
    usage: {
      promptsGenerated: 23,
      templatesCreated: 5,
      lastActivity: new Date()
    }
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: 'mike@example.com',
    username: 'mikewriter',
    firstName: 'Mike',
    lastName: 'Writer',
    password: 'hashedpassword789',
    preferences: {
      theme: 'dark',
      defaultLanguage: 'English',
      defaultTone: 'Creative',
      defaultOutputFormat: 'Markdown'
    },
    subscription: {
      plan: 'enterprise',
      status: 'active'
    },
    usage: {
      promptsGenerated: 67,
      templatesCreated: 12,
      lastActivity: new Date()
    }
  }
];

// Sample templates
const sampleTemplates = [
  {
    name: 'Blog Post Writer',
    description: 'Create engaging blog posts with SEO optimization and compelling headlines',
    promptData: {
      role: 'Content Writer',
      task: 'Write an engaging blog post',
      context: 'SEO-optimized content for website',
      tone: 'Engaging',
      outputFormat: 'Blog Post',
      constraints: 'Include SEO keywords and meta description',
      audience: 'General readers',
      industry: 'Content Marketing',
      complexity: 'Intermediate'
    },
    category: 'Content Creation',
    tags: ['blog', 'seo', 'content', 'writing', 'marketing'],
    isPublic: true,
    usageCount: 156,
    rating: { average: 4.8, count: 42 },
    createdBy: sampleUsers[0]._id
  },
  {
    name: 'Social Media Manager',
    description: 'Generate compelling social media posts across multiple platforms',
    promptData: {
      role: 'Social Media Manager',
      task: 'Create social media content',
      context: 'Multi-platform social media campaign',
      tone: 'Casual',
      outputFormat: 'Social Media Posts',
      audience: 'Social media followers',
      industry: 'Social Media Marketing',
      complexity: 'Beginner'
    },
    category: 'Social Media',
    tags: ['social', 'media', 'posts', 'engagement', 'marketing'],
    isPublic: true,
    usageCount: 203,
    rating: { average: 4.6, count: 67 },
    createdBy: sampleUsers[1]._id
  },
  {
    name: 'Email Marketing Specialist',
    description: 'Craft persuasive email campaigns that convert subscribers into customers',
    promptData: {
      role: 'Email Marketing Specialist',
      task: 'Create email marketing campaign',
      context: 'Product launch email sequence',
      tone: 'Professional',
      outputFormat: 'Email',
      constraints: 'Include clear CTA and personalization',
      audience: 'Email subscribers',
      industry: 'E-commerce',
      complexity: 'Advanced'
    },
    category: 'Email Marketing',
    tags: ['email', 'marketing', 'conversion', 'campaign', 'sales'],
    isPublic: true,
    usageCount: 89,
    rating: { average: 4.9, count: 23 },
    createdBy: sampleUsers[2]._id
  },
  {
    name: 'Code Review Assistant',
    description: 'Comprehensive template for reviewing code changes and providing constructive feedback',
    promptData: {
      role: 'Senior Software Engineer',
      task: 'Review the following code for best practices and potential issues',
      context: 'This is for a production application',
      tone: 'Professional',
      outputFormat: 'Markdown',
      constraints: 'Focus on security and performance',
      audience: 'Development team',
      industry: 'Technology',
      complexity: 'Advanced'
    },
    category: 'Technical Writing',
    tags: ['code', 'review', 'development', 'feedback'],
    isPublic: true,
    usageCount: 134,
    rating: { average: 4.7, count: 28 },
    createdBy: sampleUsers[0]._id
  },
  {
    name: 'API Documentation Guide',
    description: 'Template for writing comprehensive API documentation',
    promptData: {
      role: 'Technical Writer',
      task: 'Write comprehensive API documentation',
      context: 'REST API for authentication system',
      tone: 'Technical',
      outputFormat: 'Markdown',
      constraints: 'Include code examples and error handling',
      audience: 'Developers',
      industry: 'Technology',
      complexity: 'Advanced'
    },
    category: 'Documentation',
    tags: ['api', 'documentation', 'technical', 'rest'],
    isPublic: true,
    usageCount: 98,
    rating: { average: 4.9, count: 19 },
    createdBy: sampleUsers[1]._id
  },
  {
    name: 'UI/UX Design Brief',
    description: 'Template for creating detailed UI/UX design briefs',
    promptData: {
      role: 'UX Designer',
      task: 'Create a comprehensive design brief for a mobile app',
      context: 'E-commerce mobile application',
      tone: 'Creative',
      outputFormat: 'Structured Document',
      audience: 'Design team and stakeholders',
      industry: 'E-commerce',
      complexity: 'Intermediate'
    },
    category: 'Design',
    tags: ['ux', 'ui', 'design', 'mobile', 'ecommerce'],
    isPublic: false,
    usageCount: 45,
    rating: { average: 4.3, count: 12 },
    createdBy: sampleUsers[2]._id
  }
];

// Sample prompts
const samplePrompts = [
  {
    content: "You are a Senior UX Designer with 8+ years of experience in creating user-centered digital experiences. Design a comprehensive user onboarding flow for a fintech mobile app that helps users understand complex financial concepts.\n\nContext: Modern fintech startup targeting millennials and Gen Z\nTone: Friendly yet professional\nOutput Format: Detailed wireframes and user journey\n\n--- OPTIMIZATION APPLIED ---\nPlease provide specific examples and actionable recommendations.\nStructure your response with clear sections and visual descriptions.\nInclude accessibility considerations and mobile-first design principles.",
    promptData: {
      role: 'Senior UX Designer',
      task: 'Design a comprehensive user onboarding flow',
      context: 'Modern fintech startup targeting millennials and Gen Z',
      tone: 'Friendly yet professional',
      outputFormat: 'Detailed wireframes and user journey'
    },
    isPublic: true,
    tags: ['ux', 'design', 'onboarding', 'fintech', 'mobile'],
    metadata: {
      version: '1.0.0',
      generatedAt: new Date('2024-01-12T16:20:00Z'),
      optimized: true,
      aiEnhanced: true,
      generationTime: 3200
    },
    analytics: {
      views: 89,
      copies: 34,
      exports: 12
    },
    wordCount: 187,
    characterCount: 1124,
    keywords: ['UX', 'design', 'onboarding', 'fintech', 'mobile', 'user experience'],
    createdBy: sampleUsers[0]._id
  },
  {
    content: "You are a Data Scientist specializing in machine learning and predictive analytics. Analyze customer churn patterns and create a comprehensive retention strategy for a SaaS platform.\n\nContext: B2B SaaS company with 50,000+ users\nTone: Technical and analytical\nOutput Format: Data analysis report with visualizations\n\nConstraints: Include statistical significance and confidence intervals\nTarget Audience: C-level executives and product managers",
    promptData: {
      role: 'Data Scientist',
      task: 'Analyze customer churn patterns and create retention strategy',
      context: 'B2B SaaS company with 50,000+ users',
      tone: 'Technical and analytical',
      outputFormat: 'Data analysis report with visualizations'
    },
    isPublic: true,
    tags: ['data', 'analytics', 'churn', 'saas', 'retention'],
    metadata: {
      version: '1.0.0',
      generatedAt: new Date('2024-01-10T11:45:00Z'),
      optimized: false,
      aiEnhanced: false,
      generationTime: 2100
    },
    analytics: {
      views: 67,
      copies: 28,
      exports: 15
    },
    wordCount: 156,
    characterCount: 892,
    keywords: ['data science', 'churn', 'analytics', 'SaaS', 'retention', 'machine learning'],
    createdBy: sampleUsers[1]._id
  },
  {
    content: "You are a Senior Software Engineer. Create a comprehensive React component for a user profile dashboard that includes avatar upload, personal information editing, and preference settings.\n\nContext: This is for a modern SaaS application\nTone: Professional\nOutput Format: Code with documentation\n\n--- OPTIMIZATION APPLIED ---\nPlease be specific and provide detailed examples where appropriate.\nStructure your response clearly with appropriate headings or sections.\nProvide actionable steps that can be implemented immediately.",
    promptData: {
      role: 'Senior Software Engineer',
      task: 'Create a comprehensive React component for a user profile dashboard',
      context: 'This is for a modern SaaS application',
      tone: 'Professional',
      outputFormat: 'Code with documentation'
    },
    isPublic: false,
    tags: ['react', 'component', 'dashboard', 'profile'],
    metadata: {
      version: '1.0.0',
      generatedAt: new Date('2024-01-15T10:30:00Z'),
      optimized: true,
      aiEnhanced: true,
      generationTime: 2500
    },
    analytics: {
      views: 45,
      copies: 18,
      exports: 7
    },
    wordCount: 156,
    characterCount: 890,
    keywords: ['React', 'component', 'dashboard', 'profile', 'SaaS'],
    createdBy: sampleUsers[0]._id
  },
  {
    content: "You are a Marketing Specialist. Create a compelling email marketing campaign for a new AI-powered productivity tool launch.\n\nContext: Targeting small business owners and freelancers\nTone: Friendly\nOutput Format: Email\n\n--- OPTIMIZATION APPLIED ---\nPlease be specific and provide detailed examples where appropriate.\nStructure your response clearly with appropriate headings or sections.\nProvide actionable steps that can be implemented immediately.",
    promptData: {
      role: 'Marketing Specialist',
      task: 'Create a compelling email marketing campaign',
      context: 'Targeting small business owners and freelancers',
      tone: 'Friendly',
      outputFormat: 'Email'
    },
    isPublic: true,
    tags: ['email', 'marketing', 'campaign', 'business'],
    metadata: {
      version: '1.0.0',
      generatedAt: new Date('2024-01-13T09:15:00Z'),
      optimized: true,
      aiEnhanced: true,
      generationTime: 3200
    },
    analytics: {
      views: 78,
      copies: 32,
      exports: 14
    },
    wordCount: 178,
    characterCount: 1024,
    keywords: ['email', 'marketing', 'AI', 'productivity', 'business'],
    createdBy: sampleUsers[2]._id
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Template.deleteMany({});
    await Prompt.deleteMany({});
    console.log('✅ Existing data cleared');

    // Insert users
    console.log('👥 Inserting users...');
    await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${sampleUsers.length} users`);

    // Insert templates
    console.log('📚 Inserting templates...');
    await Template.insertMany(sampleTemplates);
    console.log(`✅ Inserted ${sampleTemplates.length} templates`);

    // Insert prompts
    console.log('📝 Inserting prompts...');
    await Prompt.insertMany(samplePrompts);
    console.log(`✅ Inserted ${samplePrompts.length} prompts`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${sampleUsers.length}`);
    console.log(`   Templates: ${sampleTemplates.length} (${sampleTemplates.filter(t => t.isPublic).length} public)`);
    console.log(`   Prompts: ${samplePrompts.length} (${samplePrompts.filter(p => p.isPublic).length} public)`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
