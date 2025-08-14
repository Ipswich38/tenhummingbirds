import { NextResponse } from 'next/server'
import { tenHummingbirdsAgent, AgentTask } from '@/lib/ai-agent'

interface AgentRequest {
  action: 'execute' | 'status' | 'initialize' | 'shutdown' | 'stop_stream'
  task?: {
    type: 'research' | 'scrape' | 'monitor' | 'navigate' | 'automation' | 'live_demo' | 'generate_image'
    description: string
    userQuery: string
    targetUrl?: string
    selector?: string
    parameters?: Record<string, unknown>
    enableLiveView?: boolean
  }
}

// Initialize agent on first API call
let agentInitialized = false

export async function POST(request: Request) {
  try {
    const { action, task }: AgentRequest = await request.json()

    // Initialize agent if not already done
    if (!agentInitialized && action !== 'shutdown') {
      try {
        await tenHummingbirdsAgent.initialize()
        agentInitialized = true
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to initialize AI Agent',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    switch (action) {
      case 'initialize':
        if (!agentInitialized) {
          await tenHummingbirdsAgent.initialize()
          agentInitialized = true
        }
        
        const initState = await tenHummingbirdsAgent.getState()
        return NextResponse.json({
          success: true,
          message: 'AI Agent initialized successfully',
          state: initState
        })

      case 'status':
        const state = await tenHummingbirdsAgent.getState()
        const browserState = await tenHummingbirdsAgent.getBrowserState()
        
        return NextResponse.json({
          success: true,
          agentState: state,
          browserState: browserState
        })

      case 'execute':
        if (!task) {
          return NextResponse.json({
            success: false,
            error: 'Task is required for execute action'
          }, { status: 400 })
        }

        // Create task with unique ID
        const agentTask: AgentTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: task.type,
          description: task.description,
          userQuery: task.userQuery,
          targetUrl: task.targetUrl,
          selector: task.selector,
          parameters: task.parameters,
          enableLiveView: task.enableLiveView
        }

        // Execute the task
        const result = await tenHummingbirdsAgent.executeTask(agentTask)
        
        return NextResponse.json({
          success: true,
          result: result
        })

      case 'stop_stream':
        await tenHummingbirdsAgent.stopLiveStream()
        
        return NextResponse.json({
          success: true,
          message: 'Live stream stopped successfully'
        })

      case 'shutdown':
        await tenHummingbirdsAgent.shutdown()
        agentInitialized = false
        
        return NextResponse.json({
          success: true,
          message: 'AI Agent shutdown successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }

  } catch (error) {
    console.error('AI Agent API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!agentInitialized) {
      return NextResponse.json({
        success: true,
        agentInitialized: false,
        message: 'AI Agent not initialized'
      })
    }

    const state = await tenHummingbirdsAgent.getState()
    const browserState = await tenHummingbirdsAgent.getBrowserState()
    
    return NextResponse.json({
      success: true,
      agentInitialized: true,
      agentState: state,
      browserState: browserState
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get agent status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}