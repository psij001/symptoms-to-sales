'use client'

interface StepConnectorProps {
  /** Whether this connector leads to a split (two items below) */
  variant?: 'single' | 'split'
}

export function StepConnector({ variant = 'single' }: StepConnectorProps) {
  if (variant === 'split') {
    return (
      <div className="flex justify-center py-2">
        <svg
          width="400"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-border"
        >
          {/* Vertical line from top center */}
          <path
            d="M200 0 L200 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Horizontal line */}
          <path
            d="M80 20 L320 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Left vertical line down */}
          <path
            d="M80 20 L80 40"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Right vertical line down */}
          <path
            d="M320 20 L320 40"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-3">
      <div className="flex flex-col items-center gap-1">
        <div className="w-0.5 h-6 bg-border" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 4px, transparent 4px, transparent 8px)' }} />
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-border"
        >
          <path
            d="M1 1L6 6L11 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
