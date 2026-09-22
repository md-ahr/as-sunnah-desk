export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/60 flex min-h-svh flex-1 flex-col items-center justify-center px-4 py-12">
      <main className="border-border bg-card w-full max-w-sm rounded-md border p-6 shadow-sm">
        {children}
      </main>
    </div>
  )
}
