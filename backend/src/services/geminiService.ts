import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyChCnRLjSvOFuF3zmkpV8BmQ79ugNj_YnU';

if (!GEMINI_API_KEY) {
  console.warn('⚠️  Gemini API key not found, AI features will be disabled');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async generatePrompt(promptData: any, optimize: boolean = false): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(promptData, optimize);
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate prompt with AI');
    }
  }

  async getSuggestions(field: string, partialText: string): Promise<string[]> {
    try {
      const prompt = this.buildSuggestionsPrompt(field, partialText);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response to extract suggestions
      return this.parseSuggestions(text);
    } catch (error) {
      console.error('Gemini suggestions error:', error);
      return this.getFallbackSuggestions(field, partialText);
    }
  }

  async getFieldCompletion(field: string, partialText: string): Promise<string[]> {
    try {
      const prompt = `Complete this ${field} field based on the partial text "${partialText}". 
      Provide 5 relevant completions, one per line, without numbering or bullets.
      Focus on professional, commonly used terms in AI and technology contexts.
      
      Field: ${field}
      Partial text: ${partialText}
      
      Completions:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.toLowerCase().startsWith(partialText.toLowerCase()))
        .slice(0, 5);
    } catch (error) {
      console.error('Gemini completion error:', error);
      return this.getFallbackCompletions(field, partialText);
    }
  }

  async getFieldAutoPopulate(task: string): Promise<{role?: string, tone?: string, outputFormat?: string, context?: string, audience?: string, industry?: string}> {
    try {
      const prompt = `Based on this task: "${task}"

      Analyze the task and suggest appropriate values for prompt engineering fields. Only suggest fields that are clearly relevant.

      Respond in this exact JSON format:
      {
        "role": "suggested role or null",
        "tone": "suggested tone or null", 
        "outputFormat": "suggested output format or null",
        "context": "suggested context or null",
        "audience": "suggested audience or null",
        "industry": "suggested industry or null"
      }

      Guidelines:
      - Only include a field if it's clearly relevant to the task
      - Use professional, specific values
      - For role: suggest the best professional role to handle this task
      - For tone: suggest appropriate communication style
      - For outputFormat: suggest the best format for the expected output
      - For context: suggest relevant background information needed
      - For audience: suggest who would benefit from this task
      - For industry: suggest the most relevant industry/domain
      - Use null for irrelevant fields

      Task: ${task}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Try to parse JSON response
        const cleanText = text.replace(/```json|```/g, '').trim();
        const suggestions = JSON.parse(cleanText);
        
        // Filter out null values and return only valid suggestions
        const validSuggestions: any = {};
        Object.entries(suggestions).forEach(([key, value]) => {
          if (value && value !== 'null' && typeof value === 'string' && value.trim()) {
            validSuggestions[key] = value.trim();
          }
        });
        
        return validSuggestions;
      } catch (parseError) {
        console.error('Failed to parse auto-populate JSON:', parseError);
        return this.getFallbackAutoPopulate(task);
      }
    } catch (error) {
      console.error('Gemini auto-populate error:', error);
      return this.getFallbackAutoPopulate(task);
    }
  }

  private buildSystemPrompt(promptData: any, optimize: boolean): string {
    const optimizationLevel = optimize ? "EXPERT LEVEL" : "PROFESSIONAL";
    
    let prompt = `You are an expert prompt engineer. Create a ${optimizationLevel} AI prompt based on the following specifications.

Your generated prompt should be:
- Clear, specific, and actionable
- Structured for optimal AI performance
- Include relevant context and constraints
- Use best practices from prompt engineering

USER SPECIFICATIONS:
`;
    
    if (promptData.role) {
      prompt += `🎭 ROLE: ${promptData.role}\n`;
    }
    
    if (promptData.task) {
      prompt += `🎯 MAIN TASK: ${promptData.task}\n`;
    }
    
    if (promptData.context) {
      prompt += `📋 CONTEXT: ${promptData.context}\n`;
    }
    
    if (promptData.tone) {
      prompt += `🎵 TONE: ${promptData.tone}\n`;
    }
    
    if (promptData.outputFormat) {
      prompt += `📄 OUTPUT FORMAT: ${promptData.outputFormat}\n`;
    }

    if (promptData.constraints) {
      prompt += `⚠️ CONSTRAINTS: ${promptData.constraints}\n`;
    }
    if (promptData.responseLength) {
      prompt += `📏 LENGTH: ${promptData.responseLength}\n`;
    }
    if (promptData.audience) {
      prompt += `👥 AUDIENCE: ${promptData.audience}\n`;
    }
    if (promptData.industry) {
      prompt += `🏢 INDUSTRY: ${promptData.industry}\n`;
    }
    if (promptData.mood) {
      prompt += `😊 MOOD: ${promptData.mood}\n`;
    }
    if (promptData.language) {
      prompt += `🌍 LANGUAGE: ${promptData.language}\n`;
    }
    if (promptData.complexity) {
      prompt += `🧠 COMPLEXITY: ${promptData.complexity}\n`;
    }
    if (promptData.customVariables) {
      prompt += `⚙️ CUSTOM VARIABLES: ${promptData.customVariables}\n`;
    }

    if (optimize) {
      prompt += `\n🚀 OPTIMIZATION REQUEST: Create an EXPERT-LEVEL prompt that:
      
1. **CLARITY & PRECISION**: Uses specific, unambiguous language
2. **STRUCTURE**: Organizes instructions logically with clear sections
3. **CONTEXT SETTING**: Provides sufficient background for optimal performance
4. **EXAMPLES**: Includes relevant examples where beneficial
5. **CONSTRAINTS**: Clearly defines boundaries and expectations
6. **OUTPUT GUIDANCE**: Specifies exactly how the response should be formatted
7. **PERFORMANCE OPTIMIZATION**: Uses proven prompt engineering techniques

ADVANCED FEATURES TO INCLUDE:
- Role-based instructions for better context
- Step-by-step thinking processes
- Quality criteria and success metrics
- Error prevention guidelines
- Template structures for consistency

Return ONLY the optimized prompt - no explanations, no metadata, just the final prompt that could be used directly with an AI model.`;
    } else {
      prompt += `\n📝 GENERATION REQUEST: Create a professional, well-structured prompt that incorporates all the above specifications.

The prompt should be:
- Direct and actionable
- Appropriately detailed
- Ready to use with AI models
- Professional in tone

Return ONLY the generated prompt - no explanations, no metadata, just the final prompt.`;
    }

    return prompt;
  }

  private buildSuggestionsPrompt(field: string, partialText: string): string {
    return `Suggest 8 professional options for the "${field}" field in an AI prompt generator.
    Current partial text: "${partialText}"
    
    Provide suggestions that:
    - Are relevant to AI, technology, and professional contexts
    - Include specific job titles, industries, or technical terms
    - Are commonly used in prompt engineering
    - Complete or extend the partial text naturally
    
    Return only the suggestions, one per line, without numbering.`;
  }

  private parseSuggestions(text: string): string[] {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[\d\-\*\•]/))
      .slice(0, 8);
  }

  private getFallbackSuggestions(field: string, partialText: string): string[] {
    const fallbacks: Record<string, string[]> = {
      role: [
        'Software Engineer', 'Technical Writer', 'Data Scientist', 'Product Manager',
        'UX Designer', 'DevOps Engineer', 'Marketing Specialist', 'Content Creator'
      ],
      task: [
        'Write documentation for', 'Create a guide on', 'Develop a strategy for',
        'Analyze and explain', 'Design a solution for', 'Implement a system for'
      ],
      tone: [
        'Professional', 'Casual', 'Friendly', 'Technical', 'Creative',
        'Authoritative', 'Conversational', 'Enthusiastic'
      ],
      outputFormat: [
        'Markdown', 'Plain Text', 'JSON', 'Code', 'Bullet Points',
        'Table', 'Essay', 'Step-by-step guide'
      ]
    };

    return fallbacks[field.toLowerCase()] || [];
  }

  private getFallbackCompletions(field: string, partialText: string): string[] {
    const completions: Record<string, Record<string, string[]>> = {
      role: {
        'full': ['Full Stack Developer', 'Full Stack Engineer', 'Full Stack Architect'],
        'senior': ['Senior Software Engineer', 'Senior Developer', 'Senior Architect'],
        'lead': ['Lead Developer', 'Lead Engineer', 'Lead Architect'],
        'data': ['Data Scientist', 'Data Engineer', 'Data Analyst'],
        'product': ['Product Manager', 'Product Owner', 'Product Designer'],
        'tech': ['Technical Writer', 'Technical Lead', 'Technical Architect']
      }
    };

    const fieldCompletions = completions[field.toLowerCase()];
    if (!fieldCompletions) return [];

    const lowerPartial = partialText.toLowerCase();
    for (const [key, values] of Object.entries(fieldCompletions)) {
      if (key.startsWith(lowerPartial)) {
        return values;
      }
    }

    return [];
  }

  private getFallbackAutoPopulate(task: string): {role?: string, tone?: string, outputFormat?: string, context?: string, audience?: string, industry?: string} {
    const lowerTask = task.toLowerCase();
    const suggestions: any = {};

    // Simple keyword-based fallback logic
    if (lowerTask.includes('write') || lowerTask.includes('document') || lowerTask.includes('guide')) {
      suggestions.role = 'Technical Writer';
      suggestions.tone = 'Professional';
      suggestions.outputFormat = 'Markdown';
    } else if (lowerTask.includes('code') || lowerTask.includes('develop') || lowerTask.includes('program')) {
      suggestions.role = 'Software Engineer';
      suggestions.tone = 'Technical';
      suggestions.outputFormat = 'Code';
    } else if (lowerTask.includes('analyze') || lowerTask.includes('data') || lowerTask.includes('research')) {
      suggestions.role = 'Data Scientist';
      suggestions.tone = 'Professional';
      suggestions.outputFormat = 'Report';
    } else if (lowerTask.includes('design') || lowerTask.includes('ui') || lowerTask.includes('ux')) {
      suggestions.role = 'UX Designer';
      suggestions.tone = 'Creative';
      suggestions.outputFormat = 'Structured Design Brief';
    } else if (lowerTask.includes('market') || lowerTask.includes('campaign') || lowerTask.includes('promote')) {
      suggestions.role = 'Marketing Specialist';
      suggestions.tone = 'Engaging';
      suggestions.outputFormat = 'Marketing Plan';
    }

    // Industry suggestions based on keywords
    if (lowerTask.includes('ai') || lowerTask.includes('machine learning') || lowerTask.includes('ml')) {
      suggestions.industry = 'Technology';
      suggestions.audience = 'Developers';
    } else if (lowerTask.includes('business') || lowerTask.includes('company') || lowerTask.includes('enterprise')) {
      suggestions.industry = 'Business';
      suggestions.audience = 'Business stakeholders';
    } else if (lowerTask.includes('education') || lowerTask.includes('learn') || lowerTask.includes('teach')) {
      suggestions.industry = 'Education';
      suggestions.audience = 'Students';
    }

    return suggestions;
  }
}

export const geminiService = new GeminiService();
