import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth/session'

export async function GET() {
  await clearSession()
  return NextResponse.redirect(new URL('/login', process.env.REPLIT_DEPLOYMENT_URL || 'http://localhost:5000'))
}

export async function POST() {
  await clearSession()
  return NextResponse.json({ success: true })
}
