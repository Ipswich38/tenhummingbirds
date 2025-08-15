// AI Agent Module - Groq-powered intelligent agent for TenHummingbirds
// Orchestrates browser automation and provides intelligent web interaction

import { TenHummingbirdsAI } from './groq-ai'
import { hummBrowser, HummCommand, HummObservation } from './humm-browser'
import { tenHummingbirdsImageGenerator, ImageGenerationRequest } from './ai-image-generator'

export interface AgentTask {
  id: string
  type: 'research' | 'scrape' | 'monitor' | 'navigate' | 'automation' | 'live_demo' | 'generate_image'
  description: string
  userQuery: string
  targetUrl?: string
  selector?: string
  parameters?: Record<string, unknown>
  enableLiveView?: boolean
}

export interface AgentResult {
  taskId: string
  success: boolean
  data?: Record<string, unknown>
  observations: HummObservation[]
  summary: string
  timestamp: number
  executionTime: number
}

export interface AgentState {
  isActive: boolean
  currentTask?: AgentTask
  browserReady: boolean
  lastActivity: number
  isLiveStreaming: boolean
  currentUrl?: string
}

export class TenHummingbirdsAgent {
  private state: AgentState = {
    isActive: false,
    browserReady: false,
    lastActivity: Date.now(),
    isLiveStreaming: false
  }

  async initialize(): Promise<void> {
    try {
      console.log('🤖 Initializing TenHummingbirds AI Agent...')
      
      // Initialize the browser tool
      await hummBrowser.initialize()
      
      this.state.browserReady = true
      this.state.isActive = true
      
      console.log('✅ TenHummingbirds AI Agent ready!')
    } catch (error) {
      console.error('❌ Failed to initialize AI Agent:', error)
      throw error
    }
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now()
    const observations: HummObservation[] = []
    
    try {
      console.log(`🎯 Executing task: ${task.description}`)
      
      this.state.currentTask = task
      this.state.lastActivity = Date.now()
      
      let result: Record<string, unknown>
      
      switch (task.type) {
        case 'research':
          result = await this.performResearch(task, observations)
          break
          
        case 'scrape':
          result = await this.performScraping(task, observations)
          break
          
        case 'navigate':
          result = await this.performNavigation(task, observations)
          break
          
        case 'monitor':
          result = await this.performMonitoring(task, observations)
          break
          
        case 'live_demo':
          result = await this.performLiveDemo(task, observations)
          break
          
        case 'generate_image':
          result = await this.performImageGeneration(task, observations)
          break
          
        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }
      
      // Generate AI summary of the task execution
      const summary = await this.generateTaskSummary(task, observations, result)
      
      const executionTime = Date.now() - startTime
      
      return {
        taskId: task.id,
        success: true,
        data: result,
        observations,
        summary,
        timestamp: startTime,
        executionTime
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorSummary = `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      
      return {
        taskId: task.id,
        success: false,
        observations,
        summary: errorSummary,
        timestamp: startTime,
        executionTime
      }
    } finally {
      this.state.currentTask = undefined
    }
  }

  private async performResearch(task: AgentTask, observations: HummObservation[]): Promise<Record<string, unknown>> {
    // Research task: Navigate to URL, extract information, analyze content
    
    if (!task.targetUrl) {
      // Use AI to determine the best website for research
      const aiResponse = await TenHummingbirdsAI.generateResponse(
        `What is the best website to research: ${task.userQuery}? Return just the URL.`,
        { analysis_type: 'strategy' }
      )
      task.targetUrl = this.extractUrlFromResponse(aiResponse.text)
    }
    
    // Navigate to the target URL
    const navCommand: HummCommand = { action: 'navigate', url: task.targetUrl }
    const navResult = await hummBrowser.executeCommand(navCommand)
    observations.push(navResult)
    
    if (!navResult.success) {
      throw new Error(`Failed to navigate to ${task.targetUrl}`)
    }
    
    // Extract page content
    const extractCommand: HummCommand = { action: 'extract' }
    const extractResult = await hummBrowser.executeCommand(extractCommand)
    observations.push(extractResult)
    
    if (!extractResult.success) {
      throw new Error('Failed to extract page content')
    }
    
    // Use AI to analyze and summarize the extracted content
    const analysisPrompt = `
      User Query: ${task.userQuery}
      
      Extracted Content: ${extractResult.content}
      
      Please analyze this content and provide relevant insights for the user's query. 
      Focus on trading and financial information if applicable.
    `
    
    const aiAnalysis = await TenHummingbirdsAI.generateResponse(analysisPrompt, {
      analysis_type: 'fundamental',
      user_style: 'professional'
    })
    
    return {
      url: task.targetUrl,
      pageTitle: navResult.pageTitle,
      extractedContent: extractResult.data,
      aiAnalysis: aiAnalysis.text,
      confidence: aiAnalysis.confidence
    }
  }

  private async performScraping(task: AgentTask, observations: HummObservation[]): Promise<Record<string, unknown>> {
    // Scraping task: Navigate and extract specific data points
    
    if (!task.targetUrl) {
      throw new Error('Target URL required for scraping task')
    }
    
    // Navigate to target
    const navCommand: HummCommand = { action: 'navigate', url: task.targetUrl }
    const navResult = await hummBrowser.executeCommand(navCommand)
    observations.push(navResult)
    
    // Extract specific elements if selector provided
    if (task.selector) {
      const extractCommand: HummCommand = { action: 'extract', selector: task.selector }
      const extractResult = await hummBrowser.executeCommand(extractCommand)
      observations.push(extractResult)
      
      return {
        url: task.targetUrl,
        selector: task.selector,
        data: extractResult.data
      }
    }
    
    // Extract full page content
    const extractCommand: HummCommand = { action: 'extract' }
    const extractResult = await hummBrowser.executeCommand(extractCommand)
    observations.push(extractResult)
    
    return {
      url: task.targetUrl,
      fullContent: extractResult.data
    }
  }

  private async performNavigation(task: AgentTask, observations: HummObservation[]): Promise<Record<string, unknown>> {
    // Navigation task: Simple page navigation and state capture
    
    if (!task.targetUrl) {
      throw new Error('Target URL required for navigation task')
    }
    
    const navCommand: HummCommand = { action: 'navigate', url: task.targetUrl }
    const navResult = await hummBrowser.executeCommand(navCommand)
    observations.push(navResult)
    
    // Take a screenshot for verification
    const screenshotCommand: HummCommand = { action: 'screenshot' }
    const screenshotResult = await hummBrowser.executeCommand(screenshotCommand)
    observations.push(screenshotResult)
    
    return {
      url: task.targetUrl,
      pageTitle: navResult.pageTitle,
      screenshot: screenshotResult.screenshot,
      navigationSuccess: navResult.success
    }
  }

  private async performMonitoring(task: AgentTask, observations: HummObservation[]): Promise<Record<string, unknown>> {
    // Monitoring task: Periodically check a page for changes
    // This is a simplified version - full implementation would use intervals
    
    if (!task.targetUrl) {
      throw new Error('Target URL required for monitoring task')
    }
    
    const navCommand: HummCommand = { action: 'navigate', url: task.targetUrl }
    const navResult = await hummBrowser.executeCommand(navCommand)
    observations.push(navResult)
    
    const extractCommand: HummCommand = { action: 'extract', selector: task.selector }
    const extractResult = await hummBrowser.executeCommand(extractCommand)
    observations.push(extractResult)
    
    return {
      url: task.targetUrl,
      monitoredData: extractResult.data,
      timestamp: Date.now()
    }
  }

  private async performImageGeneration(task: AgentTask, observations: HummObservation[]): Promise<Record<string, unknown>> {
    // Image generation task: Create visual content based on user query
    
    try {
      console.log(`🎨 Starting image generation: ${task.description}`)
      
      // Use Groq AI to analyze the request and optimize the prompt
      const analysisPrompt = `
        Analyze this image generation request and create an optimized prompt:
        
        User Query: ${task.userQuery}
        Description: ${task.description}
        
        Determine:
        1. Image type (chart, graph, diagram, visualization, creative, analysis)
        2. Style (financial, technical, minimal, detailed, professional)
        3. Optimized prompt for AI image generation
        4. Recommended dimensions
        
        Respond in this JSON format:
        {
          "imageType": "chart|graph|diagram|visualization|creative|analysis",
          "style": "financial|technical|minimal|detailed|professional",
          "optimizedPrompt": "detailed prompt for image generation",
          "dimensions": {"width": 1024, "height": 1024},
          "reasoning": "explanation of choices"
        }
      `
      
      const aiAnalysis = await TenHummingbirdsAI.generateResponse(analysisPrompt, {
        analysis_type: 'strategy',
        user_style: 'technical'
      })
      
      // Parse AI response
      let imageRequest: ImageGenerationRequest
      try {
        const analysisResult = JSON.parse(aiAnalysis.text)
        imageRequest = {
          prompt: analysisResult.optimizedPrompt || task.userQuery,
          type: analysisResult.imageType || 'creative',
          style: analysisResult.style || 'professional',
          dimensions: analysisResult.dimensions || { width: 1024, height: 1024 },
          data: task.parameters,
          parameters: {
            steps: 25,
            guidance: 7.5
          }
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        imageRequest = {
          prompt: task.userQuery,
          type: 'creative',
          style: 'professional',
          dimensions: { width: 1024, height: 1024 },
          parameters: {
            steps: 20,
            guidance: 7.5
          }
        }
      }
      
      // Add observation for AI analysis
      observations.push({
        success: true,
        data: { aiAnalysis: aiAnalysis.text, imageRequest },
        timestamp: Date.now()
      })
      
      // Generate the image
      const imageResult = await tenHummingbirdsImageGenerator.generateImage(imageRequest)
      
      // Add observation for image generation
      observations.push({
        success: imageResult.success,
        data: {
          imageGenerated: imageResult.success,
          model: imageResult.model,
          generationTime: imageResult.generationTime,
          metadata: imageResult.metadata
        },
        error: imageResult.error,
        timestamp: Date.now()
      })
      
      if (!imageResult.success) {
        throw new Error(`Image generation failed: ${imageResult.error}`)
      }
      
      return {
        imageBase64: imageResult.imageBase64,
        imageUrl: imageResult.imageUrl,
        prompt: imageResult.prompt,
        originalQuery: task.userQuery,
        model: imageResult.model,
        generationTime: imageResult.generationTime,
        metadata: imageResult.metadata,
        type: imageRequest.type,
        style: imageRequest.style,
        success: true
      }
      
    } catch (error) {
      console.error('Image generation failed:', error)
      throw error
    }
  }

  private async performLiveDemo(task: AgentTask, observations: HummObservation[]): Promise<Record<string, unknown>> {
    // Live demo task: Navigate to URL with live streaming for user to observe
    
    if (!task.targetUrl) {
      throw new Error('Target URL required for live demo task')
    }
    
    try {
      // Start live streaming for real-time visualization
      if (task.enableLiveView) {
        const streamCommand: HummCommand = { action: 'stream_start', options: { frameRate: 2 } }
        const streamResult = await hummBrowser.executeCommand(streamCommand)
        observations.push(streamResult)
        this.state.isLiveStreaming = true
      }
      
      // Navigate to target URL
      const navCommand: HummCommand = { action: 'navigate', url: task.targetUrl }
      const navResult = await hummBrowser.executeCommand(navCommand)
      observations.push(navResult)
      this.state.currentUrl = task.targetUrl
      
      if (!navResult.success) {
        throw new Error(`Failed to navigate to ${task.targetUrl}`)
      }
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Get viewport information
      const viewportCommand: HummCommand = { action: 'get_viewport' }
      const viewportResult = await hummBrowser.executeCommand(viewportCommand)
      observations.push(viewportResult)
      
      // Take a final screenshot
      const screenshotCommand: HummCommand = { action: 'screenshot' }
      const screenshotResult = await hummBrowser.executeCommand(screenshotCommand)
      observations.push(screenshotResult)
      
      return {
        url: task.targetUrl,
        pageTitle: navResult.pageTitle,
        screenshot: screenshotResult.screenshot,
        viewport: viewportResult.viewport,
        liveStreamActive: this.state.isLiveStreaming,
        navigationSuccess: navResult.success,
        demoCompleted: true
      }
      
    } catch (error) {
      // Stop streaming on error
      if (this.state.isLiveStreaming) {
        await hummBrowser.executeCommand({ action: 'stream_stop' })
        this.state.isLiveStreaming = false
      }
      throw error
    }
  }

  private async generateTaskSummary(
    task: AgentTask, 
    observations: HummObservation[], 
    result: Record<string, unknown>
  ): Promise<string> {
    const observationSummary = observations
      .filter(obs => obs.success)
      .map(obs => `${obs.timestamp}: ${obs.data ? JSON.stringify(obs.data) : 'No data'}`)
      .join('\n')
    
    const summaryPrompt = `
      Task: ${task.description}
      User Query: ${task.userQuery}
      
      Execution Steps:
      ${observationSummary}
      
      Result: ${JSON.stringify(result)}
      
      Please provide a concise, user-friendly summary of what was accomplished.
    `
    
    try {
      const aiSummary = await TenHummingbirdsAI.generateResponse(summaryPrompt, {
        user_style: 'professional'
      })
      
      return aiSummary.text
    } catch (error) {
      return `Task completed: ${task.description}. Check the detailed results for more information.`
    }
  }

  private extractUrlFromResponse(response: string): string {
    // Simple URL extraction - could be enhanced with more sophisticated parsing
    const urlRegex = /(https?:\/\/[^\s]+)/
    const match = response.match(urlRegex)
    
    if (match) {
      return match[1]
    }
    
    // Fallback URLs for common research topics
    if (response.toLowerCase().includes('finance') || response.toLowerCase().includes('stock')) {
      return 'https://finance.yahoo.com'
    }
    
    return 'https://google.com'
  }

  async getState(): Promise<AgentState> {
    return { ...this.state }
  }

  async getBrowserState(): Promise<HummObservation> {
    return await hummBrowser.getCurrentState()
  }

  async stopLiveStream(): Promise<void> {
    if (this.state.isLiveStreaming) {
      try {
        await hummBrowser.executeCommand({ action: 'stream_stop' })
        this.state.isLiveStreaming = false
        console.log('📹 Live stream stopped')
      } catch (error) {
        console.error('❌ Error stopping live stream:', error)
      }
    }
  }

  async shutdown(): Promise<void> {
    try {
      // Stop live streaming if active
      await this.stopLiveStream()
      
      await hummBrowser.close()
      this.state.isActive = false
      this.state.browserReady = false
      this.state.isLiveStreaming = false
      this.state.currentUrl = undefined
      console.log('🛑 TenHummingbirds AI Agent shutdown complete')
    } catch (error) {
      console.error('❌ Error during agent shutdown:', error)
    }
  }
}

// Singleton instance for the application
export const tenHummingbirdsAgent = new TenHummingbirdsAgent()