'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const handleLogin = () => {
    window.location.href = '/api/login'
  }

  return (
    <Card className="bg-background-elevated border-border">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-display text-text-primary">
          Create an account
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Start creating high-converting copy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-accent-hover"
          onClick={handleLogin}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign up with Replit
        </Button>

        <p className="text-xs text-text-tertiary text-center">
          Sign up with your Google, GitHub, or email account through Replit.
        </p>
      </CardContent>
    </Card>
  )
}
