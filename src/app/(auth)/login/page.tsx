'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleLogin = () => {
    window.location.href = '/api/login'
  }

  return (
    <Card className="bg-background-elevated border-border">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-display text-text-primary">
          Symptoms to Sales
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-error text-center">
            {error === 'auth_failed' ? 'Authentication failed. Please try again.' :
             error === 'callback_failed' ? 'Login callback failed. Please try again.' :
             'An error occurred. Please try again.'}
          </p>
        )}

        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-accent-hover"
          onClick={handleLogin}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign in with Replit
        </Button>

        <p className="text-xs text-text-tertiary text-center">
          Sign in with your Google, GitHub, or email account through Replit.
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="bg-background-elevated border-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-display text-text-primary">
            Symptoms to Sales
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Loading...
          </CardDescription>
        </CardHeader>
      </Card>
    }>
      <LoginContent />
    </Suspense>
  )
}
