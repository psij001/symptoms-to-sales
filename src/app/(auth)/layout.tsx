export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-deep p-6">
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {children}
      </div>
    </div>
  )
}
