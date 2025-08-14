"use client"

import { useState, useEffect, useRef } from "react"
import { Search, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Clock, BarChart3, Zap, Target, Shield, Activity, PieChart, Calculator, Settings, Send, X, Minimize2, Maximize2, Bell, Star, Eye, Plus, Heart, Filter, Bookmark, Bot, Globe, Camera, Play, Square, RefreshCw, Image, Palette, TrendingDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface TradingRecommendation {
  symbol: string
  action: "BUY" | "SELL" | "HOLD"
  confidence: number
  targetPrice: number
  currentPrice: number
  stopLoss: number
  timeframe: string
  reasoning: string[]
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  potentialReturn: number
}

// Mini App Component
interface MiniAppProps {
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}

function MiniApp({ title, description, icon, gradient, onClick, children, className = "" }: MiniAppProps) {
  return (
    <div 
      className={`relative rounded-3xl border border-border-subtle shadow-medium hover:shadow-heavy transition-all duration-300 cursor-pointer group ${gradient} ${className}`}
      onClick={onClick}
    >
      <div className="relative p-4 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate leading-tight">{title}</h3>
            <p className="text-white/80 text-xs truncate leading-tight">{description}</p>
          </div>
        </div>
        {children && (
          <div className="text-white/80 text-xs flex-1 overflow-hidden">
            {children}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
    </div>
  )
}

// Chat Message Interface
interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface TradingResearchAssistantProps {
  onLogout?: () => void
}

export function TradingResearchAssistant({ onLogout }: TradingResearchAssistantProps) {
  const [symbol, setSymbol] = useState("")
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<TradingRecommendation | null>(null)
  const [error, setError] = useState("")
  const [activeApp, setActiveApp] = useState<string | null>(null)
  const [resultsMinimized, setResultsMinimized] = useState(false)
  
  // Watchlist and customization states
  const [watchlist, setWatchlist] = useState<string[]>(["AAPL", "TSLA", "MSFT", "GOOGL"])
  const [alerts, setAlerts] = useState<any[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  // AI Agent states
  const [agentActive, setAgentActive] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentTasks, setAgentTasks] = useState<any[]>([])
  const [currentAgentTask, setCurrentAgentTask] = useState<any>(null)
  
  // AI Chat states for analyzer
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiMessages])

  const handleAnalyze = async () => {
    if (!symbol.trim()) return

    setLoading(true)
    setError("")
    setRecommendation(null)
    setResultsMinimized(false)

    try {
      const response = await fetch("/api/trading-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze symbol")
      }

      const data = await response.json()
      setRecommendation(data)
    } catch (err) {
      setError("Failed to analyze symbol. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAiQuestion = async () => {
    if (!aiInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: aiInput,
      isUser: true,
      timestamp: new Date()
    }

    setAiMessages(prev => [...prev, userMessage])
    const currentInput = aiInput
    setAiInput("")
    setAiLoading(true)

    try {
      // Enhanced context for AI
      const contextualData = {
        message: currentInput,
        context: {
          current_symbol: symbol || recommendation?.symbol,
          user_watchlist: watchlist,
          recent_analysis: recommendation ? {
            symbol: recommendation.symbol,
            action: recommendation.action,
            confidence: recommendation.confidence,
            reasoning: recommendation.reasoning
          } : null,
          user_style: "professional", // Could be dynamically determined
          previous_messages: aiMessages.slice(-3).map(m => m.content)
        }
      }

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contextualData),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()
      
      // Enhanced AI response with contextual insights
      let enhancedContent = data.response || "I apologize, but I'm having trouble processing your request right now. Please try again."
      
      // Add contextual suggestions if relevant
      if (data.recommendations && data.recommendations.length > 0) {
        enhancedContent += "\n\n💡 **Quick Actions:**"
        data.recommendations.slice(0, 2).forEach((rec: any, i: number) => {
          enhancedContent += `\n• ${rec.strategy || 'Strategy'}: ${rec.accuracy || 'High'}% confidence`
        })
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: enhancedContent,
        isUser: false,
        timestamp: new Date()
      }

      setAiMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm experiencing some technical difficulties. Please try your question again, and I'll do my best to help you with trading insights!",
        isUser: false,
        timestamp: new Date()
      }
      setAiMessages(prev => [...prev, errorMessage])
    } finally {
      setAiLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-green-500"
      case "SELL":
        return "bg-red-500"
      case "HOLD":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "HIGH":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (activeApp === 'agent') {
    return (
      <div className="h-screen bg-gradient-to-br from-surface via-background to-surface relative flex flex-col overflow-hidden">
        <div className="relative z-10 p-4 max-w-md mx-auto flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <Button 
              onClick={() => setActiveApp(null)}
              className="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle p-0"
            >
              ←
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">AI Agent</h2>
              <p className="text-sm text-text-secondary">Humm Browser & Automation</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${agentActive ? 'bg-accent' : 'bg-text-tertiary'}`}></div>
          </div>

          {/* Agent Status */}
          <div className="mb-4 p-4 bg-surface-elevated rounded-2xl border border-border-subtle flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">Agent Status</h3>
              <Badge className={`text-xs px-2 py-1 ${agentActive ? 'bg-accent text-white' : 'bg-text-tertiary text-white'}`}>
                {agentActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center">
                <p className="text-text-tertiary text-xs">Tasks Completed</p>
                <p className="font-bold text-text-primary">{agentTasks.length}</p>
              </div>
              <div className="text-center">
                <p className="text-text-tertiary text-xs">Browser Status</p>
                <p className="font-bold text-text-primary">{agentActive ? 'Ready' : 'Offline'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={async () => {
                  setAgentLoading(true)
                  try {
                    const response = await fetch('/api/ai-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'initialize' })
                    })
                    const data = await response.json()
                    if (data.success) {
                      setAgentActive(true)
                    }
                  } catch (error) {
                    console.error('Failed to initialize agent:', error)
                  } finally {
                    setAgentLoading(false)
                  }
                }}
                disabled={agentActive || agentLoading}
                className="flex-1 h-9 bg-primary hover:bg-primary-hover rounded-xl text-sm"
              >
                {agentLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                {agentLoading ? 'Starting...' : 'Initialize'}
              </Button>
              
              <Button 
                onClick={async () => {
                  try {
                    await fetch('/api/ai-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'shutdown' })
                    })
                    setAgentActive(false)
                  } catch (error) {
                    console.error('Failed to shutdown agent:', error)
                  }
                }}
                disabled={!agentActive}
                className="flex-1 h-9 bg-danger hover:bg-danger/80 rounded-xl text-sm"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-4 flex-shrink-0">
            <h3 className="font-semibold text-text-primary mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={async () => {
                  if (!agentActive) return
                  setAgentLoading(true)
                  try {
                    const response = await fetch('/api/ai-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'execute',
                        task: {
                          type: 'research',
                          description: 'Research latest market news',
                          userQuery: 'What are the latest market trends and news?',
                          targetUrl: 'https://finance.yahoo.com'
                        }
                      })
                    })
                    const data = await response.json()
                    if (data.success) {
                      setAgentTasks(prev => [...prev, data.result])
                    }
                  } catch (error) {
                    console.error('Task failed:', error)
                  } finally {
                    setAgentLoading(false)
                  }
                }}
                disabled={!agentActive || agentLoading}
                className="h-12 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm"
              >
                <Globe className="w-4 h-4 mr-2" />
                Research News
              </Button>
              
              <Button 
                onClick={async () => {
                  if (!agentActive) return
                  setAgentLoading(true)
                  try {
                    const response = await fetch('/api/ai-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'execute',
                        task: {
                          type: 'navigate',
                          description: 'Take screenshot of current market',
                          userQuery: 'Navigate to trading platform',
                          targetUrl: 'https://finance.yahoo.com'
                        }
                      })
                    })
                    const data = await response.json()
                    if (data.success) {
                      setAgentTasks(prev => [...prev, data.result])
                    }
                  } catch (error) {
                    console.error('Task failed:', error)
                  } finally {
                    setAgentLoading(false)
                  }
                }}
                disabled={!agentActive || agentLoading}
                className="h-12 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl text-sm"
              >
                <Camera className="w-4 h-4 mr-2" />
                Screenshot
              </Button>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold text-text-primary mb-3">Recent Tasks</h3>
            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
              {agentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">No tasks executed yet</p>
                  <p className="text-text-tertiary text-xs">Initialize the agent to start automating</p>
                </div>
              ) : (
                agentTasks.slice(-5).reverse().map((task, index) => (
                  <div key={index} className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-text-primary text-sm">{task.taskId}</h4>
                        <p className="text-text-secondary text-xs">{task.summary}</p>
                      </div>
                      <Badge className={`text-xs px-2 py-1 ${task.success ? 'bg-accent text-white' : 'bg-danger text-white'}`}>
                        {task.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    
                    {/* Display generated image if available */}
                    {task.data?.imageBase64 && (
                      <div className="mt-3 mb-2">
                        <img 
                          src={task.data.imageBase64} 
                          alt={task.data.prompt || 'Generated image'}
                          className="w-full h-32 object-cover rounded-xl border border-border-subtle"
                        />
                        <div className="mt-2 text-xs text-text-tertiary">
                          <p>Model: {task.data.model}</p>
                          <p>Type: {task.data.type} • Style: {task.data.style}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Display screenshot if available */}
                    {task.data?.screenshot && !task.data?.imageBase64 && (
                      <div className="mt-3 mb-2">
                        <img 
                          src={task.data.screenshot} 
                          alt="Browser screenshot"
                          className="w-full h-32 object-cover rounded-xl border border-border-subtle"
                        />
                      </div>
                    )}
                    
                    <div className="text-text-tertiary text-xs">
                      Execution time: {task.executionTime}ms
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Browser View */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">Live Browser View</h3>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'execute',
                          task: {
                            type: 'live_demo',
                            description: 'Live demo of Yahoo Finance',
                            userQuery: 'Navigate to Yahoo Finance for live demo',
                            targetUrl: 'https://finance.yahoo.com',
                            enableLiveView: true
                          }
                        })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setAgentTasks(prev => [...prev, data.result])
                      }
                    } catch (error) {
                      console.error('Failed to start live demo:', error)
                    }
                  }}
                  disabled={!agentActive}
                  className="h-8 px-3 bg-accent hover:bg-accent/80 rounded-xl text-xs"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Demo
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'stop_stream' })
                      })
                      if (response.ok) {
                        console.log('Live stream stopped')
                      }
                    } catch (error) {
                      console.error('Failed to stop stream:', error)
                    }
                  }}
                  className="h-8 px-3 bg-danger hover:bg-danger/80 rounded-xl text-xs"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
            
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-4">
              <div className="aspect-video bg-background rounded-xl flex items-center justify-center border border-border-subtle">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">Live Browser Stream</p>
                  <p className="text-text-tertiary text-xs">Start a live demo to see AI agent in action</p>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs text-text-tertiary">
                <span>Resolution: 1366x768</span>
                <span>Status: Ready</span>
                <span>FPS: 2</span>
              </div>
            </div>
          </div>

          {/* AI Image Generation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">AI Image Generation</h3>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'execute',
                          task: {
                            type: 'generate_image',
                            description: 'Generate trading chart visualization',
                            userQuery: 'Create a professional stock market chart showing bullish trend with candlesticks, moving averages, and volume indicators',
                            parameters: {
                              imageType: 'chart',
                              style: 'financial'
                            }
                          }
                        })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setAgentTasks(prev => [...prev, data.result])
                      }
                    } catch (error) {
                      console.error('Failed to generate chart:', error)
                    }
                  }}
                  disabled={!agentActive}
                  className="h-8 px-3 bg-primary hover:bg-primary-hover rounded-xl text-xs"
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Chart
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'execute',
                          task: {
                            type: 'generate_image',
                            description: 'Generate trading analysis diagram',
                            userQuery: 'Create a professional trading strategy diagram showing risk management, entry and exit points, and portfolio allocation with modern infographic style',
                            parameters: {
                              imageType: 'diagram',
                              style: 'professional'
                            }
                          }
                        })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setAgentTasks(prev => [...prev, data.result])
                      }
                    } catch (error) {
                      console.error('Failed to generate diagram:', error)
                    }
                  }}
                  disabled={!agentActive}
                  className="h-8 px-3 bg-secondary hover:bg-secondary/80 rounded-xl text-xs"
                >
                  <Palette className="w-3 h-3 mr-1" />
                  Diagram
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'execute',
                          task: {
                            type: 'generate_image',
                            description: 'Generate market analysis visualization',
                            userQuery: 'Create a comprehensive market analysis visualization showing sector performance, economic indicators, and market sentiment with clean professional design',
                            parameters: {
                              imageType: 'visualization',
                              style: 'detailed'
                            }
                          }
                        })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setAgentTasks(prev => [...prev, data.result])
                      }
                    } catch (error) {
                      console.error('Failed to generate visualization:', error)
                    }
                  }}
                  disabled={!agentActive}
                  className="h-8 px-3 bg-accent hover:bg-accent/80 rounded-xl text-xs"
                >
                  <Image className="w-3 h-3 mr-1" />
                  Visual
                </Button>
              </div>
            </div>
            
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="aspect-square bg-background rounded-xl flex items-center justify-center border border-border-subtle">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                    <p className="text-text-secondary text-xs">Chart Generation</p>
                    <p className="text-text-tertiary text-xs">Financial charts & graphs</p>
                  </div>
                </div>
                <div className="aspect-square bg-background rounded-xl flex items-center justify-center border border-border-subtle">
                  <div className="text-center">
                    <Palette className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                    <p className="text-text-secondary text-xs">Diagram Creation</p>
                    <p className="text-text-tertiary text-xs">Strategy diagrams</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Input
                  placeholder="Describe the image you want to generate..."
                  className="mb-3 text-sm bg-background border-border-subtle"
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const prompt = e.currentTarget.value.trim()
                      e.currentTarget.value = ''
                      
                      try {
                        const response = await fetch('/api/ai-agent', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'execute',
                            task: {
                              type: 'generate_image',
                              description: 'Generate custom image based on user request',
                              userQuery: prompt,
                              parameters: {
                                imageType: 'creative',
                                style: 'professional'
                              }
                            }
                          })
                        })
                        const data = await response.json()
                        if (data.success) {
                          setAgentTasks(prev => [...prev, data.result])
                        }
                      } catch (error) {
                        console.error('Failed to generate custom image:', error)
                      }
                    }
                  }}
                />
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>Models: Stable Diffusion XL, Flux</span>
                  <span>Resolution: 1024x1024</span>
                  <span>Style: Professional</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Task Input */}
          <div className="mt-4 flex-shrink-0">
            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <h4 className="font-semibold text-text-primary mb-3">Custom Task</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Describe what you want the agent to do..."
                  className="h-10 text-sm bg-background border-border-subtle rounded-xl"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select className="h-10 text-sm bg-background border border-border-subtle rounded-xl px-3">
                    <option value="research">Research</option>
                    <option value="scrape">Scrape Data</option>
                    <option value="navigate">Navigate</option>
                    <option value="monitor">Monitor</option>
                  </select>
                  <Input
                    placeholder="Target URL (optional)"
                    className="h-10 text-sm bg-background border-border-subtle rounded-xl"
                  />
                </div>
                <Button 
                  disabled={!agentActive || agentLoading}
                  className="w-full h-10 bg-primary hover:bg-primary-hover rounded-xl"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Execute Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeApp === 'portfolio') {
    return (
      <div className="h-screen bg-gradient-to-br from-surface via-background to-surface relative flex flex-col overflow-hidden">
        <div className="relative z-10 p-4 max-w-md mx-auto flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <Button 
              onClick={() => setActiveApp(null)}
              className="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle p-0"
            >
              ←
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">Portfolio Analytics</h2>
              <p className="text-sm text-text-secondary">Performance insights & metrics</p>
            </div>
            <Button 
              onClick={() => {}}
              className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 p-0"
            >
              <Filter className="w-5 h-5 text-primary" />
            </Button>
          </div>

          {/* Portfolio Overview */}
          <div className="space-y-4 mb-4 flex-shrink-0">
            <div className="p-4 bg-gradient-to-r from-accent to-primary rounded-2xl text-white">
              <div className="mb-2">
                <p className="text-white/80 text-sm">Total Portfolio Value</p>
                <h3 className="text-2xl font-bold">$125,847.50</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-xs">Today's Change</p>
                  <p className="font-bold text-lg">+$1,247 (+1.0%)</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Return</p>
                  <p className="font-bold text-lg">+$15,847 (+14.4%)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3 mb-4 flex-shrink-0">
            <h3 className="font-semibold text-text-primary">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle">
                <p className="text-text-tertiary text-xs mb-1">Win Rate</p>
                <p className="text-lg font-bold text-accent">68.5%</p>
              </div>
              <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle">
                <p className="text-text-tertiary text-xs mb-1">Sharpe Ratio</p>
                <p className="text-lg font-bold text-text-primary">1.42</p>
              </div>
              <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle">
                <p className="text-text-tertiary text-xs mb-1">Max Drawdown</p>
                <p className="text-lg font-bold text-danger">-8.2%</p>
              </div>
              <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle">
                <p className="text-text-tertiary text-xs mb-1">Volatility</p>
                <p className="text-lg font-bold text-text-primary">15.7%</p>
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold text-text-primary mb-3">Top Holdings</h3>
            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
              {['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN'].map((stock, index) => (
                <div key={stock} className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">{stock[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-sm">{stock}</h4>
                        <p className="text-text-secondary text-xs">{(100 / (index + 1)).toFixed(0)} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary text-sm">
                        ${(Math.random() * 10000 + 5000).toFixed(0)}
                      </p>
                      <p className={`text-xs font-bold ${index % 3 === 0 ? 'text-accent' : index % 3 === 1 ? 'text-danger' : 'text-accent'}`}>
                        {index % 3 === 0 ? '+2.1%' : index % 3 === 1 ? '-1.2%' : '+0.8%'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.max(15, 30 - index * 5)}%` }}
                    ></div>
                  </div>
                  <p className="text-text-tertiary text-xs mt-1">
                    {Math.max(15, 30 - index * 5)}% of portfolio
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex-shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-12 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl">
                <Calculator className="w-4 h-4 mr-2" />
                Rebalance
              </Button>
              <Button className="h-12 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl">
                <Target className="w-4 h-4 mr-2" />
                Set Goals
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeApp === 'alerts') {
    return (
      <div className="h-screen bg-gradient-to-br from-surface via-background to-surface relative flex flex-col overflow-hidden">
        <div className="relative z-10 p-4 max-w-md mx-auto flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <Button 
              onClick={() => setActiveApp(null)}
              className="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle p-0"
            >
              ←
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">Smart Alerts</h2>
              <p className="text-sm text-text-secondary">Personalized trading notifications</p>
            </div>
            <Button 
              onClick={() => {}}
              className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 p-0"
            >
              <Plus className="w-5 h-5 text-primary" />
            </Button>
          </div>

          {/* Alert Categories */}
          <div className="flex gap-2 mb-4 flex-shrink-0">
            {['Price', 'Volume', 'Technical', 'News'].map((type) => (
              <Button
                key={type}
                className="px-3 py-1 h-8 text-xs bg-surface-elevated border border-border-subtle rounded-xl hover:bg-primary/10"
              >
                {type}
              </Button>
            ))}
          </div>

          {/* Active Alerts */}
          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Bell className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm">AAPL Price Alert</h3>
                    <p className="text-text-secondary text-xs">Price reaches $175</p>
                  </div>
                </div>
                <Badge className="bg-accent text-white text-xs px-2 py-1">Active</Badge>
              </div>
              <div className="text-text-tertiary text-xs">
                Current: $172.50 | Target: $175.00 | +1.4% to trigger
              </div>
            </div>

            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm">TSLA Volume Spike</h3>
                    <p className="text-text-secondary text-xs">Volume &gt; 50M shares</p>
                  </div>
                </div>
                <Badge className="bg-warning text-white text-xs px-2 py-1">Triggered</Badge>
              </div>
              <div className="text-text-tertiary text-xs">
                Triggered at 2:30 PM | Volume: 52.3M shares
              </div>
            </div>

            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm">MSFT RSI Alert</h3>
                    <p className="text-text-secondary text-xs">RSI drops below 30</p>
                  </div>
                </div>
                <Badge className="bg-accent text-white text-xs px-2 py-1">Active</Badge>
              </div>
              <div className="text-text-tertiary text-xs">
                Current RSI: 32.5 | Target: 30.0 | Oversold signal
              </div>
            </div>
          </div>

          {/* Create Alert */}
          <div className="mt-4 flex-shrink-0">
            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <h4 className="font-semibold text-text-primary mb-3">Create New Alert</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Symbol"
                    className="h-10 text-sm bg-background border-border-subtle rounded-xl"
                  />
                  <select className="h-10 text-sm bg-background border border-border-subtle rounded-xl px-3">
                    <option>Price</option>
                    <option>Volume</option>
                    <option>RSI</option>
                    <option>MACD</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="h-10 text-sm bg-background border border-border-subtle rounded-xl px-3">
                    <option>Above</option>
                    <option>Below</option>
                    <option>Crosses</option>
                  </select>
                  <Input
                    placeholder="Value"
                    className="h-10 text-sm bg-background border-border-subtle rounded-xl"
                  />
                </div>
                <Button className="w-full h-10 bg-primary hover:bg-primary-hover rounded-xl">
                  Create Alert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeApp === 'watchlist') {
    return (
      <div className="h-screen bg-gradient-to-br from-surface via-background to-surface relative flex flex-col overflow-hidden">
        <div className="relative z-10 p-4 max-w-md mx-auto flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <Button 
              onClick={() => setActiveApp(null)}
              className="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle p-0"
            >
              ←
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">My Watchlist</h2>
              <p className="text-sm text-text-secondary">Track your favorite symbols</p>
            </div>
            <Button 
              onClick={() => {}}
              className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 p-0"
            >
              <Plus className="w-5 h-5 text-primary" />
            </Button>
          </div>

          {/* Watchlist Items */}
          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
            {watchlist.map((stock, index) => (
              <div key={stock} className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">{stock}</h3>
                      <p className="text-text-secondary text-sm">Stock Symbol</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSymbol(stock)}
                    className="h-8 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-xl"
                  >
                    Analyze
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-text-tertiary text-xs">Price</p>
                    <p className="font-bold text-text-primary">
                      ${(Math.random() * 200 + 50).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Change</p>
                    <p className={`font-bold ${index % 3 === 0 ? 'text-accent' : index % 3 === 1 ? 'text-danger' : 'text-accent'}`}>
                      {index % 3 === 0 ? '+2.1%' : index % 3 === 1 ? '-0.8%' : '+1.3%'}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Volume</p>
                    <p className="font-bold text-text-primary">
                      {(Math.random() * 10 + 1).toFixed(1)}M
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Symbol Input */}
          <div className="mt-4 flex-shrink-0">
            <div className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle">
              <h4 className="font-semibold text-text-primary mb-3">Add to Watchlist</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter symbol (e.g., AAPL)"
                  className="flex-1 h-10 text-sm bg-background border-border-subtle rounded-xl"
                />
                <Button className="h-10 px-4 bg-primary hover:bg-primary-hover rounded-xl">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeApp === 'analyzer') {
    return (
      <div className="h-screen bg-gradient-to-br from-surface via-background to-surface relative flex flex-col overflow-hidden">
        {/* Mobile-first Analyzer View */}
        <div className="relative z-10 p-4 max-w-md mx-auto flex-1 flex flex-col min-h-0">
          {/* Fixed Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setActiveApp(null)}
                className="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle p-0"
              >
                ←
              </Button>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Market Analyzer</h2>
                <p className="text-sm text-text-secondary">
                  <span className="text-primary">ten</span>
                  <span className="text-secondary">hummingbirds</span> analysis
                </p>
              </div>
            </div>
            {onLogout && (
              <Button
                onClick={onLogout}
                className="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle p-0"
                title="Logout"
              >
                <Shield className="w-4 h-4 text-text-tertiary" />
              </Button>
            )}
          </div>

          {/* Fixed Search Input */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <Input
                placeholder="Enter symbol..."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="h-14 text-lg px-6 pr-20 bg-surface-elevated border-border-subtle rounded-2xl"
                disabled={loading}
              />
              <Button 
                onClick={handleAnalyze} 
                disabled={loading || !symbol.trim()}
                className="absolute right-2 top-2 h-10 px-4 bg-primary hover:bg-primary-hover rounded-xl"
              >
                {loading ? "..." : "Go"}
              </Button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Results Area - Compact and Collapsible */}
            <div className="flex-shrink-0">
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-danger text-sm">{error}</p>
                    <Button
                      onClick={() => setError("")}
                      className="w-6 h-6 rounded-full p-0 bg-danger/20 hover:bg-danger/30"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="space-y-3 mb-4">
                  <div className="h-20 bg-surface-elevated/50 rounded-2xl animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-surface-elevated/50 rounded-2xl animate-pulse"></div>
                    <div className="h-16 bg-surface-elevated/50 rounded-2xl animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Results */}
              {recommendation && !loading && (
                <div className="mb-4">
                  {/* Minimized View */}
                  {resultsMinimized ? (
                    <div className="p-3 bg-primary rounded-2xl text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-base">{recommendation.symbol}</h3>
                          <Badge className={`px-2 py-1 rounded-lg text-xs font-bold text-white ${getActionColor(recommendation.action)}`}>
                            {recommendation.action}
                          </Badge>
                          <span className="text-white/80 text-sm">{recommendation.confidence}%</span>
                        </div>
                        <Button
                          onClick={() => setResultsMinimized(false)}
                          className="w-6 h-6 rounded-full p-0 bg-white/20 hover:bg-white/30"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Expanded View */
                    <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                      {/* Main Result Card */}
                      <div className="p-4 bg-primary rounded-2xl text-white overflow-hidden">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold truncate">{recommendation.symbol}</h3>
                            <p className="text-white/80 text-sm truncate">Analysis Complete</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`px-2 py-1 rounded-lg font-bold text-white ${getActionColor(recommendation.action)} flex-shrink-0`}>
                              {recommendation.action}
                            </Badge>
                            <Button
                              onClick={() => setResultsMinimized(true)}
                              className="w-6 h-6 rounded-full p-0 bg-white/20 hover:bg-white/30 ml-2"
                            >
                              <Minimize2 className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => setRecommendation(null)}
                              className="w-6 h-6 rounded-full p-0 bg-white/20 hover:bg-white/30"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="min-w-0">
                            <p className="text-white/60 text-xs">Confidence</p>
                            <p className="text-base font-bold truncate">{recommendation.confidence}%</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/60 text-xs">Return</p>
                            <p className="text-base font-bold truncate">{recommendation.potentialReturn > 0 ? "+" : ""}{recommendation.potentialReturn.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden">
                          <p className="text-text-secondary text-xs mb-1">Current</p>
                          <p className="text-sm font-bold text-text-primary truncate">${recommendation.currentPrice.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden">
                          <p className="text-text-secondary text-xs mb-1">Target</p>
                          <p className="text-sm font-bold text-accent truncate">${recommendation.targetPrice.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Analysis Points */}
                      <div className="p-3 bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden">
                        <h4 className="font-semibold text-text-primary mb-2 text-sm">Key Insights</h4>
                        <div className="space-y-1">
                          {recommendation.reasoning.slice(0, 2).map((reason, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                              <p className="text-text-secondary text-xs leading-relaxed break-words">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Chat Interface - Takes Remaining Space */}
            <div className="flex-1 flex flex-col min-h-0 mt-4">
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-border-subtle flex-shrink-0">
                  <h4 className="font-semibold text-text-primary flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    AI Assistant
                  </h4>
                </div>
                
                {/* Messages Display - Internal Scroll Only */}
                <div className="flex-1 flex flex-col min-h-0">
                  {aiMessages.length > 0 && (
                    <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-hide">
                      {aiMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${
                            message.isUser
                              ? 'bg-primary text-white rounded-br-md shadow-sm'
                              : 'bg-background border border-border-subtle text-text-primary rounded-bl-md shadow-sm'
                          }`}>
                            <p className="break-words leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-2">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-background border border-border-subtle p-4 rounded-2xl rounded-bl-md shadow-sm">
                            <div className="flex gap-1 mb-2">
                              <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce delay-200"></div>
                            </div>
                            <p className="text-xs text-text-tertiary">AI is thinking...</p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                  
                  {/* Empty State */}
                  {aiMessages.length === 0 && !aiLoading && (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <h5 className="font-semibold text-text-primary mb-2">AI Assistant Ready</h5>
                        <p className="text-text-secondary text-sm">Ask questions about trading analysis, market insights, or strategy recommendations</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Fixed AI Chat Input */}
                <div className="p-4 border-t border-border-subtle bg-surface flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        placeholder="Ask AI about trading, analysis, or strategies..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAiQuestion()}
                        className="flex-1 h-11 text-sm bg-background border-border-subtle rounded-xl"
                        disabled={aiLoading}
                      />
                      <Button
                        onClick={handleAiQuestion}
                        disabled={aiLoading || !aiInput.trim()}
                        className="h-11 w-11 rounded-xl bg-primary hover:bg-primary-hover p-0 flex-shrink-0 shadow-sm"
                      >
                        {aiLoading ? (
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-100"></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-200"></div>
                          </div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface relative overflow-hidden">
      {/* Subtle background elements for mobile */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-4 max-w-md mx-auto">
        {/* Mobile Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl backdrop-blur-sm">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-primary">ten</span>
              <span className="text-secondary">hummingbirds</span>
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            your intelligent AI trading assistant
          </p>
        </div>

        {/* Mini Apps Dashboard */}
        <div className="space-y-6">
          {/* Quick Analysis */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary px-2">Quick Analysis</h2>
            <div className="grid grid-cols-1 gap-4">
              <MiniApp
                title="Market Analyzer"
                description="AI-powered analysis & chat"
                icon={<BarChart3 className="w-5 h-5 text-white" />}
                gradient="bg-blue-600"
                onClick={() => setActiveApp('analyzer')}
                className="h-28"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                    <span className="text-white/80 text-xs">Real-time insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                    <span className="text-white/80 text-xs">AI assistant integrated</span>
                  </div>
                </div>
              </MiniApp>
            </div>
          </div>

          {/* Watchlist & Alerts */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary px-2">My Watchlist</h2>
            <div className="grid grid-cols-1 gap-3">
              <MiniApp
                title="Watchlist"
                description="Track your favorite symbols"
                icon={<Star className="w-5 h-5 text-white" />}
                gradient="bg-purple-600"
                onClick={() => setActiveApp('watchlist')}
                className="h-32"
              >
                <div className="space-y-1 mt-2">
                  {watchlist.slice(0, 3).map((stock, i) => (
                    <div key={stock} className="flex items-center justify-between">
                      <span className="text-white/80 text-xs font-medium">{stock}</span>
                      <span className="text-white/80 text-xs">
                        {i === 0 ? "+2.1%" : i === 1 ? "-0.8%" : "+1.3%"}
                      </span>
                    </div>
                  ))}
                  <div className="text-white/60 text-xs">+{watchlist.length - 3} more</div>
                </div>
              </MiniApp>
            </div>
          </div>

          {/* Smart Alerts */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary px-2">Smart Alerts</h2>
            <div className="grid grid-cols-2 gap-4">
              <MiniApp
                title="Alerts"
                description="Price & volume alerts"
                icon={<Bell className="w-5 h-5 text-white" />}
                gradient="bg-red-600"
                onClick={() => setActiveApp('alerts')}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs font-medium">3 Active</p>
                  <p className="text-white/60 text-xs">2 Triggered today</p>
                </div>
              </MiniApp>

              <MiniApp
                title="AI Agent"
                description="Browser automation"
                icon={<Bot className="w-5 h-5 text-white" />}
                gradient="bg-indigo-600"
                onClick={() => setActiveApp('agent')}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs font-medium">{agentActive ? 'Active' : 'Ready'}</p>
                  <p className="text-white/60 text-xs">{agentTasks.length} tasks completed</p>
                </div>
              </MiniApp>
            </div>
          </div>

          {/* AI Image Generation */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary px-2">AI Image Generation</h2>
            <div className="grid grid-cols-2 gap-4">
              <MiniApp
                title="Chart Generator"
                description="AI-powered charts"
                icon={<BarChart3 className="w-5 h-5 text-white" />}
                gradient="bg-purple-600"
                onClick={async () => {
                  if (!agentActive) {
                    // Initialize agent first
                    try {
                      const response = await fetch('/api/ai-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'initialize' })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setAgentActive(true)
                      }
                    } catch (error) {
                      console.error('Failed to initialize agent:', error)
                      return
                    }
                  }
                  
                  // Generate sample trading chart
                  try {
                    const response = await fetch('/api/ai-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'execute',
                        task: {
                          type: 'generate_image',
                          description: 'Generate financial chart',
                          userQuery: 'Create a professional candlestick chart showing a bullish trend with support and resistance levels, volume indicators, and moving averages for stock analysis',
                          parameters: {
                            imageType: 'chart',
                            style: 'financial'
                          }
                        }
                      })
                    })
                    const data = await response.json()
                    if (data.success) {
                      setAgentTasks(prev => [...prev, data.result])
                    }
                  } catch (error) {
                    console.error('Failed to generate chart:', error)
                  }
                }}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs font-medium">Stable Diffusion</p>
                  <p className="text-white/60 text-xs">Charts & graphs</p>
                </div>
              </MiniApp>

              <MiniApp
                title="Visual Creator"
                description="Diagrams & graphics"
                icon={<Palette className="w-5 h-5 text-white" />}
                gradient="bg-violet-600"
                onClick={async () => {
                  if (!agentActive) {
                    // Initialize agent first
                    try {
                      const response = await fetch('/api/ai-agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'initialize' })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setAgentActive(true)
                      }
                    } catch (error) {
                      console.error('Failed to initialize agent:', error)
                      return
                    }
                  }
                  
                  // Generate sample analysis diagram
                  try {
                    const response = await fetch('/api/ai-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'execute',
                        task: {
                          type: 'generate_image',
                          description: 'Generate analysis diagram',
                          userQuery: 'Create a comprehensive trading strategy infographic showing portfolio diversification, risk management zones, entry/exit strategies, and market analysis workflow with professional design',
                          parameters: {
                            imageType: 'diagram',
                            style: 'professional'
                          }
                        }
                      })
                    })
                    const data = await response.json()
                    if (data.success) {
                      setAgentTasks(prev => [...prev, data.result])
                    }
                  } catch (error) {
                    console.error('Failed to generate diagram:', error)
                  }
                }}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs font-medium">Flux Model</p>
                  <p className="text-white/60 text-xs">Infographics</p>
                </div>
              </MiniApp>
            </div>
          </div>

          {/* Tools & Calculators */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary px-2">Tools & Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              <MiniApp
                title="Portfolio"
                description="Performance analytics"
                icon={<PieChart className="w-5 h-5 text-white" />}
                gradient="bg-green-600"
                onClick={() => setActiveApp('portfolio')}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs font-medium">+12.5%</p>
                  <p className="text-white/60 text-xs">This month</p>
                </div>
              </MiniApp>

              <MiniApp
                title="Calculator"
                description="Risk & returns"
                icon={<Calculator className="w-5 h-5 text-white" />}
                gradient="bg-orange-600"
                onClick={() => setActiveApp('calculator')}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs">Position sizing</p>
                  <p className="text-white/60 text-xs">Risk management</p>
                </div>
              </MiniApp>
            </div>
          </div>

          {/* Market Data */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary px-2">Market Data</h2>
            <div className="grid grid-cols-2 gap-4">
              <MiniApp
                title="Live Prices"
                description="Real-time quotes"
                icon={<Activity className="w-5 h-5 text-white" />}
                gradient="bg-cyan-600"
                onClick={() => {}}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs">Markets open</p>
                </div>
              </MiniApp>

              <MiniApp
                title="Trends"
                description="Market movers"
                icon={<TrendingUp className="w-5 h-5 text-white" />}
                gradient="bg-pink-600"
                onClick={() => {}}
                className="h-24"
              >
                <div>
                  <p className="text-white/80 text-xs">Top gainers</p>
                </div>
              </MiniApp>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-text-primary px-2">Settings</h2>
            <div className="grid grid-cols-1 gap-4">
              <MiniApp
                title="Preferences"
                description="Customize your experience"
                icon={<Settings className="w-5 h-5 text-white" />}
                gradient="bg-gray-600"
                onClick={() => {}}
                className="h-20"
              />
            </div>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-20"></div>
      </div>

    </div>
  )
}