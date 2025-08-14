"use client"

import { useState, useEffect } from "react"
import { Zap, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginProps {
  onLogin: (passcode: string) => void
}

export function Login({ onLogin }: LoginProps) {
  const [passcode, setPasscode] = useState("")
  const [showPasscode, setShowPasscode] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passcode.trim()) {
      setError("Please enter a passcode")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Verify passcode with API
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      })

      const data = await response.json()

      if (data.success) {
        // Store session
        localStorage.setItem('tenhummingbirds_session', data.token)
        onLogin(passcode)
      } else {
        setError(data.error || 'Invalid passcode')
      }
    } catch (error) {
      setError('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('tenhummingbirds_session')
    if (session) {
      // Verify session is still valid
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${session}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          onLogin('authenticated')
        } else {
          localStorage.removeItem('tenhummingbirds_session')
        }
      })
      .catch(() => {
        localStorage.removeItem('tenhummingbirds_session')
      })
    }
  }, [onLogin])

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface relative flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-accent/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl backdrop-blur-sm">
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-primary">ten</span>
            <span className="text-secondary">hummingbirds</span>
          </h1>
          <p className="text-text-secondary">
            Your intelligent AI trading assistant
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-surface-elevated/80 backdrop-blur-xl rounded-3xl border border-border-subtle shadow-heavy p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Secure Access</h2>
            <p className="text-text-secondary text-sm">Enter your passcode to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPasscode ? "text" : "password"}
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="h-14 text-lg px-6 pr-14 bg-surface border-border-subtle rounded-2xl text-center tracking-wider"
                disabled={loading}
                autoFocus
              />
              <Button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 bg-transparent hover:bg-text-tertiary/10 rounded-full"
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4 text-text-tertiary" />
                ) : (
                  <Eye className="w-4 h-4 text-text-tertiary" />
                )}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-2xl">
                <p className="text-danger text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full h-14 text-lg bg-primary hover:bg-primary-hover rounded-2xl shadow-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                'Access Platform'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-tertiary text-xs">
              Secure access powered by enterprise-grade encryption
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <p className="text-text-secondary text-sm mb-4">What's inside:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-elevated/60 rounded-2xl p-4 border border-border-subtle">
              <h3 className="font-semibold text-text-primary text-sm mb-1">AI Market Analysis</h3>
              <p className="text-text-tertiary text-xs">Real-time insights</p>
            </div>
            <div className="bg-surface-elevated/60 rounded-2xl p-4 border border-border-subtle">
              <h3 className="font-semibold text-text-primary text-sm mb-1">Browser Automation</h3>
              <p className="text-text-tertiary text-xs">Humm AI agent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}