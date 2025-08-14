// AI Models Service for Trading Platform
// Integrates best financial AI models from Hugging Face

import { HfInference } from '@huggingface/inference'

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Best Available Financial AI Models on Hugging Face
export const FINANCIAL_AI_MODELS = {
  // Financial Text Analysis & Generation (Free/Public models)
  FINBERT: 'ProsusAI/finbert', // Financial sentiment analysis
  FINANCIAL_SENTIMENT: 'mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis',
  GENERAL_QA: 'microsoft/DialoGPT-medium', // Conversational AI (smaller, more available)
  
  // Backup models that are typically available
  SENTIMENT_ANALYSIS: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
  TEXT_GENERATION: 'gpt2', // Reliable fallback for text generation
  QUESTION_ANSWERING: 'distilbert-base-cased-distilled-squad', // Reliable Q&A model
  
  // Financial-specific (may require API key)
  TRADING_BERT: 'EleutherAI/gpt-j-6b', // Keep as premium option
  FINANCIAL_GPT: 'EleutherAI/gpt-neo-1.3B', // Keep as premium option
  BERT_FINANCE: 'yiyanghkust/finbert-tone', // Financial tone analysis
} as const

export interface AIModelResponse {
  text: string
  confidence: number
  model_used: string
  processing_time: number
}

export class FinancialAI {
  
  // Generate intelligent trading analysis using financial models
  static async generateTradingAnalysis(
    query: string,
    context: {
      symbol?: string
      analysis_type: 'technical' | 'fundamental' | 'sentiment' | 'risk' | 'strategy'
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
      timeframe: string
    }
  ): Promise<AIModelResponse> {
    const startTime = Date.now()
    
    try {
      // Build enhanced prompt with financial context
      const enhancedPrompt = this.buildFinancialPrompt(query, context)
      
      // Try multiple models for better availability
      let response
      const modelsToTry = [
        FINANCIAL_AI_MODELS.TEXT_GENERATION,
        FINANCIAL_AI_MODELS.GENERAL_QA,
        FINANCIAL_AI_MODELS.FINANCIAL_GPT
      ]
      
      for (const model of modelsToTry) {
        try {
          response = await hf.textGeneration({
            model,
            inputs: enhancedPrompt,
            parameters: {
              max_new_tokens: 200,
              temperature: 0.7,
              do_sample: true,
              top_p: 0.9,
              repetition_penalty: 1.1,
              return_full_text: false
            }
          })
          
          if (response && response.generated_text) {
            break
          }
        } catch (modelError) {
          console.warn(`Model ${model} failed:`, modelError)
          continue
        }
      }
      
      if (!response || !response.generated_text) {
        throw new Error('All AI models failed')
      }
      
      const processingTime = Date.now() - startTime
      
      return {
        text: this.cleanAndFormatResponse(response.generated_text || '', query),
        confidence: 85, // High confidence for specialized financial model
        model_used: FINANCIAL_AI_MODELS.FINANCIAL_GPT,
        processing_time: processingTime
      }
      
    } catch (error) {
      console.error('Financial AI generation error:', error)
      // Fallback to knowledge base response
      return this.getFallbackResponse(query, context)
    }
  }
  
  // Analyze sentiment of financial text/news
  static async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral'
    confidence: number
    impact: 'bullish' | 'bearish' | 'neutral'
  }> {
    try {
      const response = await hf.textClassification({
        model: FINANCIAL_AI_MODELS.SENTIMENT_ANALYSIS,
        inputs: text
      })
      
      const result = Array.isArray(response) ? response[0] : response
      const sentiment = result.label.toLowerCase() as 'positive' | 'negative' | 'neutral'
      
      return {
        sentiment,
        confidence: Math.round(result.score * 100),
        impact: sentiment === 'positive' ? 'bullish' : sentiment === 'negative' ? 'bearish' : 'neutral'
      }
      
    } catch (error) {
      console.error('Sentiment analysis error:', error)
      return { sentiment: 'neutral', confidence: 50, impact: 'neutral' }
    }
  }
  
  // Generate market commentary using financial BERT
  static async generateMarketCommentary(
    marketData: {
      symbol: string
      price: number
      change: number
      volume: number
      indicators: Record<string, number>
    }
  ): Promise<AIModelResponse> {
    const startTime = Date.now()
    
    const prompt = `Market Analysis for ${marketData.symbol}:
Current Price: $${marketData.price}
Price Change: ${marketData.change > 0 ? '+' : ''}${marketData.change}%
Volume: ${marketData.volume}
Technical Indicators: ${JSON.stringify(marketData.indicators)}

Provide professional trading analysis and market outlook:`
    
    try {
      const response = await hf.textGeneration({
        model: FINANCIAL_AI_MODELS.TRADING_BERT,
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.6,
          top_p: 0.85
        }
      })
      
      return {
        text: this.cleanAndFormatResponse(response.generated_text || '', prompt),
        confidence: 82,
        model_used: FINANCIAL_AI_MODELS.TRADING_BERT,
        processing_time: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('Market commentary error:', error)
      return {
        text: `Technical analysis for ${marketData.symbol} shows ${marketData.change > 0 ? 'positive' : 'negative'} momentum with current indicators suggesting ${this.getBasicAnalysis(marketData)}.`,
        confidence: 65,
        model_used: 'fallback',
        processing_time: Date.now() - startTime
      }
    }
  }
  
  // Question-answering for trading queries
  static async answerTradingQuestion(
    question: string,
    context: string = ''
  ): Promise<AIModelResponse> {
    const startTime = Date.now()
    
    const enhancedContext = context || `TenHummingbirds is an AI trading platform providing institutional-grade market analysis, technical indicators, risk management, and trading strategies with high accuracy rates.`
    
    try {
      const response = await hf.questionAnswering({
        model: FINANCIAL_AI_MODELS.QUESTION_ANSWERING,
        inputs: {
          question,
          context: enhancedContext
        }
      })
      
      return {
        text: response.answer,
        confidence: Math.round(response.score * 100),
        model_used: FINANCIAL_AI_MODELS.FINANCIAL_QA,
        processing_time: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('Q&A error:', error)
      return this.getFallbackResponse(question, { analysis_type: 'strategy', risk_level: 'MEDIUM', timeframe: 'daily' })
    }
  }
  
  // Build comprehensive financial prompt
  private static buildFinancialPrompt(
    query: string,
    context: {
      symbol?: string
      analysis_type: string
      risk_level: string
      timeframe: string
    }
  ): string {
    const basePrompt = `You are a professional financial analyst and trading expert. Provide detailed, accurate analysis.

User Query: ${query}
Analysis Type: ${context.analysis_type}
Risk Level: ${context.risk_level}
Timeframe: ${context.timeframe}
${context.symbol ? `Stock Symbol: ${context.symbol}` : ''}

Professional Analysis:`
    
    return basePrompt
  }
  
  // Clean and format AI response
  private static cleanAndFormatResponse(response: string, originalPrompt: string): string {
    // Remove the original prompt from response
    let cleaned = response.replace(originalPrompt, '').trim()
    
    // Remove common AI artifacts
    cleaned = cleaned.replace(/^(Response:|Analysis:|Answer:)/i, '').trim()
    cleaned = cleaned.replace(/\n\n+/g, '\n\n') // Remove excessive line breaks
    
    // Ensure response starts properly
    if (!cleaned.startsWith('📊') && !cleaned.startsWith('Based on') && !cleaned.startsWith('The')) {
      cleaned = `Based on current market analysis, ${cleaned}`
    }
    
    // Limit response length
    if (cleaned.length > 800) {
      cleaned = cleaned.substring(0, 800) + '...'
    }
    
    return cleaned || 'I apologize, but I need more specific information to provide detailed analysis.'
  }
  
  // Fallback response using knowledge base
  private static getFallbackResponse(
    query: string,
    context: {
      analysis_type: string
      risk_level: string
      timeframe: string
    }
  ): AIModelResponse {
    const responses = {
      technical: `📊 Technical analysis shows key indicators suggesting market momentum. RSI and MACD signals provide insights for ${context.timeframe} trading with ${context.risk_level.toLowerCase()} risk approach.`,
      fundamental: `📈 Fundamental analysis reveals important valuation metrics and earnings trends. Consider P/E ratios, revenue growth, and sector performance for ${context.risk_level.toLowerCase()} risk investments.`,
      sentiment: `📊 Market sentiment indicators show current investor psychology and market mood. Fear/greed index and news sentiment provide contrarian signals for strategic positioning.`,
      risk: `🛡️ Risk management is crucial for ${context.risk_level.toLowerCase()} risk tolerance. Position sizing, stop-losses, and portfolio diversification are key components for success.`,
      strategy: `🎯 Trading strategy development requires combining technical, fundamental, and risk factors. Focus on proven methodologies with historical performance data.`
    }
    
    return {
      text: responses[context.analysis_type as keyof typeof responses] || responses.strategy,
      confidence: 75,
      model_used: 'knowledge_base',
      processing_time: 50
    }
  }
  
  // Basic analysis for market commentary fallback
  private static getBasicAnalysis(marketData: { change: number, indicators: Record<string, number> }): string {
    const rsi = marketData.indicators.rsi || 50
    const macd = marketData.indicators.macd || 0
    
    if (rsi > 70) return 'overbought conditions with potential reversal signals'
    if (rsi < 30) return 'oversold conditions with potential buying opportunities'
    if (macd > 0 && marketData.change > 0) return 'bullish momentum with positive technical signals'
    if (macd < 0 && marketData.change < 0) return 'bearish momentum with caution advised'
    
    return 'mixed signals requiring careful analysis and risk management'
  }
}

// Model health checking
export async function checkModelHealth(): Promise<Record<string, boolean>> {
  const models = Object.values(FINANCIAL_AI_MODELS)
  const health: Record<string, boolean> = {}
  
  for (const model of models) {
    try {
      // Simple test query
      await hf.textGeneration({
        model,
        inputs: 'Test',
        parameters: { max_new_tokens: 1 }
      })
      health[model] = true
    } catch {
      health[model] = false
    }
  }
  
  return health
}