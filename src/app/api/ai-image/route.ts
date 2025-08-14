import { NextResponse } from 'next/server'
import { tenHummingbirdsImageGenerator, ImageGenerationRequest } from '@/lib/ai-image-generator'

export async function POST(request: Request) {
  try {
    const body: ImageGenerationRequest = await request.json()

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    // Set default values
    const imageRequest: ImageGenerationRequest = {
      prompt: body.prompt,
      type: body.type || 'creative',
      style: body.style || 'professional',
      dimensions: body.dimensions || { width: 1024, height: 1024 },
      data: body.data,
      parameters: {
        steps: body.parameters?.steps || 20,
        guidance: body.parameters?.guidance || 7.5,
        seed: body.parameters?.seed
      }
    }

    console.log(`🎨 Generating ${imageRequest.type} image: "${imageRequest.prompt}"`)

    // Generate the image
    const result = await tenHummingbirdsImageGenerator.generateImage(imageRequest)

    if (result.success) {
      console.log(`✅ Image generated successfully in ${result.generationTime}ms using ${result.model}`)
      
      return NextResponse.json({
        success: true,
        result: {
          imageBase64: result.imageBase64,
          imageUrl: result.imageUrl,
          prompt: result.prompt,
          model: result.model,
          generationTime: result.generationTime,
          metadata: result.metadata
        }
      })
    } else {
      console.error(`❌ Image generation failed: ${result.error}`)
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Image generation failed',
        generationTime: result.generationTime
      }, { status: 500 })
    }

  } catch (error) {
    console.error('AI Image API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    info: {
      name: 'TenHummingbirds AI Image Generator',
      version: '1.0.0',
      supportedTypes: ['chart', 'graph', 'diagram', 'visualization', 'creative', 'analysis'],
      supportedStyles: ['financial', 'technical', 'minimal', 'detailed', 'professional'],
      models: [
        'stable-diffusion-xl-base-1.0',
        'flux-1-dev',
        'chart-generator (programmatic)',
        'groq-optimized (prompt enhancement)'
      ],
      maxDimensions: { width: 1024, height: 1024 },
      defaultParameters: {
        steps: 20,
        guidance: 7.5,
        dimensions: { width: 1024, height: 1024 }
      }
    }
  })
}