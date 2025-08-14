"use client"

import { useState, useEffect } from "react"
import { TradingResearchAssistant } from "@/components/trading-research-assistant"
import { Login } from "@/components/login"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const session = localStorage.getItem('tenhummingbirds_session')
    if (session) {
      // Verify session is still valid
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${session}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('tenhummingbirds_session')
        }
      })
      .catch(() => {
        localStorage.removeItem('tenhummingbirds_session')
      })
      .finally(() => {
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleLogin = (passcode: string) => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('tenhummingbirds_session')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return <TradingResearchAssistant onLogout={handleLogout} />
}
