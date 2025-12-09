import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-deep">
      <div className="text-center space-y-6 px-6">
        <h1 className="text-display text-text-primary">
          Symptoms to Sales
        </h1>
        <p className="text-xl text-text-secondary max-w-lg">
          Professional writing tools for deal-makers who care about craft.
          Powered by Claude AI.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent-hover"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
