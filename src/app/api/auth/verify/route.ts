import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        valid: false,
        error: 'No token provided'
      }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      // Check if token is expired
      if (decoded.expires && Date.now() > decoded.expires) {
        return NextResponse.json({
          valid: false,
          error: 'Token expired'
        }, { status: 401 })
      }

      return NextResponse.json({
        valid: true,
        user: {
          authenticated: decoded.authenticated,
          timestamp: decoded.timestamp
        }
      })

    } catch (jwtError) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({
      valid: false,
      error: 'Verification failed'
    }, { status: 500 })
  }
}