import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyB7O_pCoXdzsMAytdUssXNuK0ApF-3PIXg');

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
      prompt += `\nRole/Persona: ${promptData.role}`;
    }

    if (promptData.task) {
      prompt += `\nMain Task: ${promptData.task}`;
    }

    if (promptData.context) {
      prompt += `\nContext: ${promptData.context}`;
    }

    if (promptData.tone) {
      prompt += `\nTone/Style: ${promptData.tone}`;
    }

    if (promptData.outputFormat) {
      prompt += `\nOutput Format: ${promptData.outputFormat}`;
    }

    // Advanced fields
    if (promptData.constraints) {
      prompt += `\nConstraints: ${promptData.constraints}`;
    }

    if (promptData.responseLength) {
      prompt += `\nResponse Length: ${promptData.responseLength}`;
    }

    if (promptData.audience) {
      prompt += `\nTarget Audience: ${promptData.audience}`;
    }

    if (promptData.industry) {
      prompt += `\nIndustry Context: ${promptData.industry}`;
    }

    if (promptData.mood) {
      prompt += `\nMood/Emotion: ${promptData.mood}`;
    }

    if (promptData.language) {
      prompt += `\nLanguage: ${promptData.language}`;
    }

    if (promptData.complexity) {
      prompt += `\nComplexity Level: ${promptData.complexity}`;
    }

    if (promptData.customVariables) {
      prompt += `\nCustom Variables: ${promptData.customVariables}`;
    }

    if (optimize) {
      prompt += `

OPTIMIZATION INSTRUCTIONS:
- Apply advanced prompt engineering techniques
- Include specific formatting instructions
- Add relevant examples or templates
- Incorporate chain-of-thought reasoning where appropriate
- Use clear delimiters and structure
- Include error handling and edge cases
- Make the prompt self-documenting

Generate the optimized AI prompt now:`;
    } else {
      prompt += `

Generate a professional AI prompt based on these specifications:`;
    }

    return prompt;
  }
}

export const geminiService = new GeminiService();