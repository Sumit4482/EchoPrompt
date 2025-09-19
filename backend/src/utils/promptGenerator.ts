import { PromptData } from '../types';

export class PromptGenerator {
  static generatePrompt(data: PromptData): string {
    let prompt = "";
    
    // Role section
    if (data.role) {
      prompt += `You are a ${data.role}. `;
    }
    
    // Main task
    if (data.task) {
      prompt += `${data.task}`;
    }
    
    // Context section
    if (data.context) {
      prompt += `\n\nContext: ${data.context}`;
    }
    
    // Tone specification
    if (data.tone) {
      prompt += `\n\nTone: ${data.tone}`;
    }
    
    // Output format
    if (data.outputFormat) {
      prompt += `\n\nOutput Format: ${data.outputFormat}`;
    }

    // Advanced constraints
    if (data.constraints) {
      prompt += `\n\nConstraints: ${data.constraints}`;
    }
    
    if (data.responseLength) {
      prompt += `\n\nResponse Length: ${data.responseLength}`;
    }
    
    if (data.audience) {
      prompt += `\n\nTarget Audience: ${data.audience}`;
    }
    
    if (data.industry) {
      prompt += `\n\nIndustry Context: ${data.industry}`;
    }
    
    if (data.mood) {
      prompt += `\n\nMood/Emotion: ${data.mood}`;
    }
    
    if (data.language) {
      prompt += `\n\nLanguage: ${data.language}`;
    }
    
    if (data.complexity) {
      prompt += `\n\nComplexity Level: ${data.complexity}`;
    }
    
    if (data.customVariables) {
      prompt += `\n\nCustom Variables: ${data.customVariables}`;
    }
    
    return prompt.trim();
  }

  static optimizePrompt(originalPrompt: string): string {
    // Basic optimization rules
    let optimized = originalPrompt;

    // Add clarity improvements
    if (!optimized.includes('Be specific') && !optimized.includes('specific')) {
      optimized += '\n\nPlease be specific and provide detailed examples where appropriate.';
    }

    // Add structure guidance
    if (!optimized.includes('structure') && !optimized.includes('format')) {
      optimized += '\n\nStructure your response clearly with appropriate headings or sections.';
    }

    // Add actionability
    if (optimized.includes('guide') || optimized.includes('how to') || optimized.includes('steps')) {
      optimized += '\n\nProvide actionable steps that can be implemented immediately.';
    }

    return optimized;
  }

  static generateMarkdown(content: string): string {
    return `# AI Prompt

${content}

---
*Generated with EchoPrompt*`;
  }

  static generateJSON(content: string, metadata?: any): string {
    return JSON.stringify({
      prompt: content,
      metadata: {
        generated_at: new Date().toISOString(),
        generator: "EchoPrompt",
        version: "1.0.0",
        ...metadata
      }
    }, null, 2);
  }

  static generateTable(content: string): string {
    const lines = content.split('\n').filter(line => line.trim());
    let table = "| Section | Content |\n|---------|--------|\n";
    
    let currentSection = "Main";
    lines.forEach((line, index) => {
      if (line.includes(':')) {
        const [section, ...contentParts] = line.split(':');
        currentSection = section?.trim() || currentSection;
        const sectionContent = contentParts.join(':').trim();
        if (sectionContent) {
          table += `| ${currentSection} | ${sectionContent} |\n`;
        }
      } else if (line.trim()) {
        table += `| ${currentSection} | ${line.trim()} |\n`;
      }
    });
    
    return table;
  }

  static validatePromptData(data: PromptData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!data.task || data.task.trim().length === 0) {
      errors.push('Task is required');
    }

    // Length validation
    if (data.task && data.task.length > 1000) {
      errors.push('Task description is too long (max 1000 characters)');
    }

    if (data.context && data.context.length > 2000) {
      errors.push('Context is too long (max 2000 characters)');
    }

    if (data.constraints && data.constraints.length > 500) {
      errors.push('Constraints are too long (max 500 characters)');
    }

    if (data.customVariables && data.customVariables.length > 1000) {
      errors.push('Custom variables are too long (max 1000 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static extractKeywords(promptData: PromptData): string[] {
    const keywords: string[] = [];
    
    // Extract from role
    if (promptData.role) {
      keywords.push(...promptData.role.toLowerCase().split(/\s+/));
    }
    
    // Extract from task (first 50 words)
    if (promptData.task) {
      const taskWords = promptData.task.toLowerCase().split(/\s+/).slice(0, 50);
      keywords.push(...taskWords);
    }
    
    // Add category keywords
    if (promptData.industry) {
      keywords.push(promptData.industry.toLowerCase());
    }
    
    if (promptData.tone) {
      keywords.push(promptData.tone.toLowerCase());
    }
    
    if (promptData.outputFormat) {
      keywords.push(promptData.outputFormat.toLowerCase());
    }

    // Remove common words and duplicates
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'
    ]);

    return [...new Set(keywords)]
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 20); // Limit to 20 keywords
  }

  static calculateComplexityScore(promptData: PromptData): number {
    let score = 0;
    
    // Base score for having a task
    if (promptData.task) score += 1;
    
    // Add points for additional fields
    if (promptData.role) score += 0.5;
    if (promptData.context) score += 1;
    if (promptData.constraints) score += 1;
    if (promptData.customVariables) score += 1.5;
    
    // Length-based scoring
    const totalLength = (promptData.task?.length || 0) + 
                       (promptData.context?.length || 0) + 
                       (promptData.constraints?.length || 0);
    
    if (totalLength > 500) score += 1;
    if (totalLength > 1000) score += 1;
    
    // Normalize to 0-10 scale
    return Math.min(Math.round(score * 2), 10);
  }
}
