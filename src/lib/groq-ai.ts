// Groq AI Service for TenHummingbirds Trading Platform
// Conversational, friendly, professional AI with adaptive communication

import Groq from 'groq-sdk'
import { HfInference } from '@huggingface/inference'

// Initialize AI clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Best Groq models for trading conversations
export const GROQ_MODELS = {
  PRIMARY: 'llama3-8b-8192',      // Fast, conversational
  ADVANCED: 'llama3-70b-8192',    // More sophisticated analysis
  FAST: 'mixtral-8x7b-32768',     // Quick responses
  FALLBACK: 'gemma-7b-it'         // Reliable backup
} as const

export interface ConversationalResponse {
  text: string
  confidence: number
  model_used: string
  processing_time: number
  personality_adapted: boolean
  communication_style: 'casual' | 'professional' | 'technical' | 'friendly'
}

export class TenHummingbirdsAI {
  
  // Main conversational AI with adaptive personality
  static async generateResponse(
    message: string,
    context: {
      user_style?: 'casual' | 'professional' | 'technical' | 'friendly'
      previous_messages?: string[]
      trading_context?: string
      analysis_type?: 'technical' | 'fundamental' | 'sentiment' | 'risk' | 'strategy'
    } = {}
  ): Promise<ConversationalResponse> {
    const startTime = Date.now()
    
    // Detect user communication style from message
    const detectedStyle = this.detectCommunicationStyle(message)
    const adaptedStyle = context.user_style || detectedStyle
    
    // Build conversational prompt with personality
    const systemPrompt = this.buildPersonalityPrompt(adaptedStyle, context.analysis_type)
    const userPrompt = this.enhanceUserMessage(message, context)
    
    try {
      // Try Groq first (primary provider)
      const groqResponse = await this.tryGroqModels(systemPrompt, userPrompt)
      
      if (groqResponse) {
        return {
          text: this.enhanceResponse(groqResponse, adaptedStyle),
          confidence: 90, // High confidence for Groq
          model_used: 'Groq Llama3',
          processing_time: Date.now() - startTime,
          personality_adapted: true,
          communication_style: adaptedStyle
        }
      }
      
      // Fallback to Hugging Face if Groq fails
      console.warn('Groq failed, falling back to Hugging Face')
      const hfResponse = await this.fallbackToHuggingFace(message, context)
      
      return {
        text: this.enhanceResponse(hfResponse, adaptedStyle),
        confidence: 75, // Lower confidence for fallback
        model_used: 'Hugging Face (Fallback)',
        processing_time: Date.now() - startTime,
        personality_adapted: true,
        communication_style: adaptedStyle
      }
      
    } catch (error) {
      console.error('All AI providers failed:', error)
      
      // Ultimate fallback with personality
      return this.getPersonalizedFallback(message, adaptedStyle, Date.now() - startTime)
    }
  }
  
  // Try multiple Groq models for best results
  private static async tryGroqModels(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const modelsToTry = [
      GROQ_MODELS.PRIMARY,
      GROQ_MODELS.FAST,
      GROQ_MODELS.ADVANCED
    ]
    
    for (const model of modelsToTry) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 0.9,
        })
        
        const response = completion.choices[0]?.message?.content
        if (response && response.trim().length > 20) {
          return response.trim()
        }
        
      } catch (modelError) {
        console.warn(`Groq model ${model} failed:`, modelError)
        continue
      }
    }
    
    return null
  }
  
  // Detect user's communication style from their message
  private static detectCommunicationStyle(message: string): 'casual' | 'professional' | 'technical' | 'friendly' {
    const lowerMessage = message.toLowerCase()
    
    // Technical indicators
    const technicalTerms = ['rsi', 'macd', 'fibonacci', 'bollinger', 'volatility', 'correlation', 'algorithm']
    const hasTechnicalTerms = technicalTerms.some(term => lowerMessage.includes(term))
    
    // Casual indicators
    const casualIndicators = ['hey', 'yo', 'sup', 'gonna', 'wanna', '?', 'lol', 'btw', 'thx']
    const hasCasualTerms = casualIndicators.some(term => lowerMessage.includes(term))
    
    // Professional indicators
    const professionalTerms = ['analyze', 'assessment', 'evaluation', 'recommendation', 'portfolio', 'strategy']
    const hasProfessionalTerms = professionalTerms.some(term => lowerMessage.includes(term))
    
    // Friendly indicators
    const friendlyIndicators = ['please', 'thanks', 'help', 'explain', 'understand', 'learn']
    const hasFriendlyTerms = friendlyIndicators.some(term => lowerMessage.includes(term))
    
    if (hasTechnicalTerms) return 'technical'
    if (hasCasualTerms) return 'casual'
    if (hasProfessionalTerms) return 'professional'
    if (hasFriendlyTerms) return 'friendly'
    
    return 'professional' // default
  }
  
  // Build personality-adapted system prompt
  private static buildPersonalityPrompt(style: string, analysisType?: string): string {
    const basePersonality = `You are the AI assistant for TenHummingbirds, an intelligent trading platform. You provide accurate, helpful trading insights with 99.9% accuracy goals.`
    
    const stylePrompts = {
      casual: `${basePersonality} Be conversational, friendly, and use everyday language. Feel free to use casual expressions while staying informative. Think of yourself as a knowledgeable friend helping with trading.`,
      
      professional: `${basePersonality} Maintain a professional, authoritative tone. Use precise language, structured responses, and industry terminology appropriately. You're a seasoned trading expert.`,
      
      technical: `${basePersonality} Focus on technical details, use specific trading terminology, provide data-driven insights. You're a technical analysis specialist who loves diving deep into charts and indicators.`,
      
      friendly: `${basePersonality} Be warm, encouraging, and supportive. Use gentle explanations, show empathy for learning challenges, and celebrate user insights. You're a patient trading mentor.`
    }
    
    let prompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.professional
    
    // Add analysis-specific context
    if (analysisType) {
      const analysisContext = {
        technical: 'Focus on charts, indicators, patterns, and technical analysis.',
        fundamental: 'Emphasize company financials, earnings, valuation metrics.',
        sentiment: 'Analyze market psychology, fear/greed indicators, news impact.',
        risk: 'Prioritize risk management, position sizing, portfolio protection.',
        strategy: 'Provide actionable trading strategies and implementation guidance.'
      }
      
      prompt += ` ${analysisContext[analysisType as keyof typeof analysisContext] || ''}`
    }
    
    prompt += `\n\nKey guidelines:
- Always be helpful and accurate
- Adapt to the user's communication style
- Use emojis sparingly but appropriately
- Keep responses concise but informative
- Focus on actionable trading insights
- Maintain the 99.9% accuracy standard`
    
    return prompt
  }
  
  // Enhance user message with context
  private static enhanceUserMessage(message: string, context: any): string {
    let enhancedMessage = message
    
    if (context.trading_context) {
      enhancedMessage += `\n\nContext: ${context.trading_context}`
    }
    
    if (context.previous_messages && context.previous_messages.length > 0) {
      enhancedMessage += `\n\nPrevious conversation context: ${context.previous_messages.slice(-2).join(' → ')}`
    }
    
    return enhancedMessage
  }
  
  // Enhance AI response based on communication style
  private static enhanceResponse(response: string, style: string): string {
    if (!response) return response
    
    // Remove any system artifacts
    let cleaned = response
      .replace(/^(Assistant:|AI:|Response:)/i, '')
      .replace(/\n\n+/g, '\n\n')
      .trim()
    
    // Style-specific enhancements
    switch (style) {
      case 'casual':
        // Add casual touches if response is too formal
        if (!cleaned.match(/[👍💡📈📊🎯]/)) {
          cleaned = `${cleaned} 📈`
        }
        break
        
      case 'technical':
        // Ensure technical precision
        if (cleaned.length < 50) {
          cleaned += '\n\nWant me to dive deeper into the technical details?'
        }
        break
        
      case 'friendly':
        // Add encouraging tone
        if (!cleaned.match(/[!]/)) {
          cleaned = cleaned.replace(/\.$/, '! 😊')
        }
        break
    }
    
    return cleaned
  }
  
  // Fallback to Hugging Face when Groq fails
  private static async fallbackToHuggingFace(message: string, context: any): Promise<string> {
    // Try using the original Hugging Face integration
    const prompt = `User: ${message}\n\nAssistant: Based on TenHummingbirds trading analysis,`
    
    try {
      const response = await hf.textGeneration({
        model: 'gpt2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.8,
          top_p: 0.9,
          return_full_text: false
        }
      })
      
      return response.generated_text || 'I apologize, but I need to analyze this further.'
      
    } catch (error) {
      console.error('Hugging Face fallback failed:', error)
      throw error
    }
  }
  
  // Ultimate fallback with personality
  private static getPersonalizedFallback(
    message: string, 
    style: string, 
    processingTime: number
  ): ConversationalResponse {
    const fallbackResponses = {
      casual: [
        "Hey! I'm having some technical hiccups right now, but I'm here to help with your trading questions! 📈 What specific analysis are you looking for?",
        "Oops! My AI brain needs a moment to catch up. Mind rephrasing your question? I'm great with technical analysis, risk management, and trading strategies! 💡",
        "Technical difficulties on my end! 🤖 But don't worry, I can still help you with trading insights. What's your main concern?"
      ],
      
      professional: [
        "I'm currently experiencing connectivity issues with my primary analysis engines. However, I can provide trading insights based on established methodologies. How may I assist with your analysis?",
        "Technical systems are momentarily unavailable. I remain capable of providing fundamental analysis, risk assessment, and strategic guidance. What specific area interests you?",
        "Primary AI models are offline, but my knowledge base remains accessible for trading analysis, market insights, and strategy development."
      ],
      
      technical: [
        "System diagnostics indicate temporary API limitations. I can still provide technical analysis using RSI, MACD, Bollinger Bands, and other indicators. Which metrics interest you?",
        "Network connectivity to advanced models interrupted. Local analysis capabilities include chart patterns, volume analysis, and trend identification. Specify your requirements.",
        "Primary computation engines offline. Backup systems available for technical indicator calculations, pattern recognition, and signal analysis."
      ],
      
      friendly: [
        "I'm so sorry, but I'm having some connection troubles! 😅 Don't worry though, I'm still here to help you learn about trading! What would you like to explore together?",
        "Oh no! My advanced AI friends aren't responding right now, but I'd love to help you understand trading concepts! What's on your mind? 🤗",
        "Technical hiccup on my end! But hey, I'm still excited to help you with trading questions. What aspect of the markets interests you most? 📚"
      ]
    }
    
    const responses = fallbackResponses[style as keyof typeof fallbackResponses] || fallbackResponses.professional
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      text: selectedResponse,
      confidence: 60,
      model_used: 'Fallback Response',
      processing_time: processingTime,
      personality_adapted: true,
      communication_style: style as any
    }
  }
  
  // Health check for AI services
  static async healthCheck(): Promise<{
    groq: boolean
    huggingface: boolean
    primary_available: boolean
  }> {
    const results = { groq: false, huggingface: false, primary_available: false }
    
    // Test Groq
    try {
      await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: GROQ_MODELS.FAST,
        max_tokens: 5
      })
      results.groq = true
      results.primary_available = true
    } catch {
      results.groq = false
    }
    
    // Test Hugging Face
    try {
      await hf.textGeneration({
        model: 'gpt2',
        inputs: 'test',
        parameters: { max_new_tokens: 5 }
      })
      results.huggingface = true
    } catch {
      results.huggingface = false
    }
    
    return results
  }
}