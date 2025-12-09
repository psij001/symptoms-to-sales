import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-deep p-8">
      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-6">
          Symptoms to Sales
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-10 leading-relaxed">
          Professional writing tools for deal-makers who care about craft. Powered by Claude AI.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-8">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              className="px-8 bg-accent text-accent-foreground hover:bg-accent-hover"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
