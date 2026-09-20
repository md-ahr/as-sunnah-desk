export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center bg-muted/60 px-4 py-12">
      <main className="w-full max-w-sm rounded-md border border-border bg-card p-6 shadow-sm">
        {children}
      </main>
    </div>
  )
}
