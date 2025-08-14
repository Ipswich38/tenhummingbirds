// AI Image Generation Service - Multi-model support for TenHummingbirds
// Supports various open source models and chart generation

export interface ImageGenerationRequest {
  prompt: string
  type: 'chart' | 'graph' | 'diagram' | 'visualization' | 'creative' | 'analysis'
  style?: 'financial' | 'technical' | 'minimal' | 'detailed' | 'professional'
  dimensions?: {
    width: number
    height: number
  }
  data?: Record<string, unknown>
  parameters?: {
    steps?: number
    guidance?: number
    seed?: number
  }
}

export interface ImageGenerationResult {
  success: boolean
  imageUrl?: string
  imageBase64?: string
  prompt: string
  model: string
  generationTime: number
  error?: string
  metadata?: {
    dimensions: { width: number; height: number }
    format: string
    size: number
  }
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'candlestick' | 'area' | 'scatter'
  title: string
  data: Array<{
    label: string
    value: number | number[]
    color?: string
  }>
  xAxis?: string
  yAxis?: string
  timeRange?: string
}

export class TenHummingbirdsImageGenerator {
  private readonly huggingFaceToken: string
  private readonly groqApiKey: string

  constructor() {
    this.huggingFaceToken = process.env.HUGGINGFACE_API_KEY || ''
    this.groqApiKey = process.env.GROQ_API_KEY || ''
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now()

    try {
      // Determine the best generation method based on type
      switch (request.type) {
        case 'chart':
        case 'graph':
          return await this.generateChart(request, startTime)
        case 'diagram':
        case 'visualization':
          return await this.generateVisualization(request, startTime)
        case 'creative':
        case 'analysis':
          return await this.generateCreativeImage(request, startTime)
        default:
          return await this.generateCreativeImage(request, startTime)
      }
    } catch (error) {
      return {
        success: false,
        prompt: request.prompt,
        model: 'unknown',
        generationTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async generateChart(request: ImageGenerationRequest, startTime: number): Promise<ImageGenerationResult> {
    // For chart generation, we'll use a combination of canvas API and AI enhancement
    try {
      // If data is provided, use programmatic chart generation
      if (request.data && this.isChartData(request.data)) {
        return await this.generateProgrammaticChart(request.data as ChartData, request, startTime)
      }

      // Otherwise, use AI to generate chart visualization
      const enhancedPrompt = this.enhanceChartPrompt(request.prompt, request.style)
      return await this.generateWithStableDiffusion(enhancedPrompt, request, startTime, 'chart-generator')
    } catch (error) {
      throw new Error(`Chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async generateVisualization(request: ImageGenerationRequest, startTime: number): Promise<ImageGenerationResult> {
    // Generate technical diagrams, flowcharts, or data visualizations
    const enhancedPrompt = this.enhanceVisualizationPrompt(request.prompt, request.style)
    return await this.generateWithStableDiffusion(enhancedPrompt, request, startTime, 'diagram-generator')
  }

  private async generateCreativeImage(request: ImageGenerationRequest, startTime: number): Promise<ImageGenerationResult> {
    // Generate creative images, illustrations, or analysis visuals
    const enhancedPrompt = this.enhanceCreativePrompt(request.prompt, request.style)
    return await this.generateWithStableDiffusion(enhancedPrompt, request, startTime, 'creative-generator')
  }

  private async generateWithStableDiffusion(
    prompt: string, 
    request: ImageGenerationRequest, 
    startTime: number,
    model: string
  ): Promise<ImageGenerationResult> {
    try {
      // Use Hugging Face's Stable Diffusion models
      const response = await fetch(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              num_inference_steps: request.parameters?.steps || 20,
              guidance_scale: request.parameters?.guidance || 7.5,
              width: request.dimensions?.width || 1024,
              height: request.dimensions?.height || 1024,
              seed: request.parameters?.seed
            }
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')
      const imageBase64 = `data:image/png;base64,${base64Image}`

      return {
        success: true,
        imageBase64,
        prompt,
        model: `stable-diffusion-xl (${model})`,
        generationTime: Date.now() - startTime,
        metadata: {
          dimensions: {
            width: request.dimensions?.width || 1024,
            height: request.dimensions?.height || 1024
          },
          format: 'png',
          size: imageBuffer.byteLength
        }
      }
    } catch (error) {
      // Fallback to alternative model if Stable Diffusion fails
      return await this.generateWithAlternativeModel(prompt, request, startTime, model)
    }
  }

  private async generateWithAlternativeModel(
    prompt: string, 
    request: ImageGenerationRequest, 
    startTime: number,
    model: string
  ): Promise<ImageGenerationResult> {
    try {
      // Fallback to Flux model or other open source alternatives
      const response = await fetch(
        'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              num_inference_steps: request.parameters?.steps || 15,
              guidance_scale: request.parameters?.guidance || 3.5,
              width: request.dimensions?.width || 1024,
              height: request.dimensions?.height || 1024
            }
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Alternative model API error: ${response.status} ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')
      const imageBase64 = `data:image/png;base64,${base64Image}`

      return {
        success: true,
        imageBase64,
        prompt,
        model: `flux-dev (${model})`,
        generationTime: Date.now() - startTime,
        metadata: {
          dimensions: {
            width: request.dimensions?.width || 1024,
            height: request.dimensions?.height || 1024
          },
          format: 'png',
          size: imageBuffer.byteLength
        }
      }
    } catch (error) {
      throw new Error(`All image generation models failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async generateProgrammaticChart(
    chartData: ChartData, 
    request: ImageGenerationRequest, 
    startTime: number
  ): Promise<ImageGenerationResult> {
    // Generate charts programmatically using canvas or chart libraries
    // This would be implemented with chart.js or similar library in a browser environment
    // For now, we'll use AI generation with structured data description
    
    const dataDescription = this.describeChartData(chartData)
    const enhancedPrompt = `${request.prompt}\n\nData visualization requirements:\n${dataDescription}\n\nStyle: Professional financial chart, clean design, ${request.style || 'minimal'} style`
    
    return await this.generateWithStableDiffusion(enhancedPrompt, request, startTime, 'data-chart')
  }

  private enhanceChartPrompt(prompt: string, style?: string): string {
    const styleModifiers = {
      financial: 'professional financial chart, clean lines, business colors, grid background',
      technical: 'technical analysis chart, candlesticks, indicators, trading view style',
      minimal: 'minimal design, clean lines, simple colors, white background',
      detailed: 'detailed chart with annotations, labels, comprehensive data visualization',
      professional: 'corporate style, professional color scheme, clear typography'
    }

    const baseEnhancement = 'high quality chart visualization, professional design, clean and readable'
    const styleEnhancement = style ? styleModifiers[style] || styleModifiers.professional : styleModifiers.professional

    return `${prompt}, ${baseEnhancement}, ${styleEnhancement}, vector style, infographic quality`
  }

  private enhanceVisualizationPrompt(prompt: string, style?: string): string {
    const baseEnhancement = 'professional diagram, clear visualization, informative design'
    const styleAddition = style === 'technical' ? ', technical diagram style' : ', business presentation style'

    return `${prompt}, ${baseEnhancement}${styleAddition}, high quality, vector graphics style`
  }

  private enhanceCreativePrompt(prompt: string, style?: string): string {
    const baseEnhancement = 'high quality illustration, professional design'
    const styleAddition = style === 'financial' ? ', financial theme, business context' : ', modern clean design'

    return `${prompt}, ${baseEnhancement}${styleAddition}, detailed, artistic quality`
  }

  private isChartData(data: Record<string, unknown>): boolean {
    return (
      typeof data.type === 'string' &&
      typeof data.title === 'string' &&
      Array.isArray(data.data)
    )
  }

  private describeChartData(chartData: ChartData): string {
    const dataPoints = chartData.data.map(item => `${item.label}: ${item.value}`).join(', ')
    return `Chart type: ${chartData.type}\nTitle: ${chartData.title}\nData points: ${dataPoints}\nX-axis: ${chartData.xAxis || 'Categories'}\nY-axis: ${chartData.yAxis || 'Values'}`
  }

  // Enhanced prompt generation using Groq for intelligent prompt optimization
  async optimizePromptWithGroq(basePrompt: string, imageType: string): Promise<string> {
    try {
      const optimizationPrompt = `
        Optimize this image generation prompt for creating ${imageType} images:
        "${basePrompt}"
        
        Provide an enhanced prompt that will generate high-quality, professional images.
        Focus on clarity, visual appeal, and technical accuracy.
        Return only the optimized prompt.
      `

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at optimizing prompts for AI image generation. Create concise, effective prompts that produce high-quality visual results.'
            },
            {
              role: 'user',
              content: optimizationPrompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0]?.message?.content?.trim() || basePrompt
      }
    } catch (error) {
      console.warn('Groq prompt optimization failed, using original prompt:', error)
    }

    return basePrompt
  }
}

// Singleton instance for the application
export const tenHummingbirdsImageGenerator = new TenHummingbirdsImageGenerator()