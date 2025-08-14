import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Production passcode - should be moved to environment variables
const PRODUCTION_PASSCODE = process.env.TENHUMMINGBIRDS_PASSCODE || 'hummingbird2024'
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production'

interface AuthRequest {
  passcode: string
}

export async function POST(request: Request) {
  try {
    const { passcode }: AuthRequest = await request.json()

    if (!passcode) {
      return NextResponse.json({
        success: false,
        error: 'Passcode is required'
      }, { status: 400 })
    }

    // Verify passcode
    if (passcode === PRODUCTION_PASSCODE) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          authenticated: true,
          timestamp: Date.now(),
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      return NextResponse.json({
        success: true,
        token,
        message: 'Authentication successful'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid passcode'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json({
      success: false,
      error: 'Authentication failed'
    }, { status: 500 })
  }
}