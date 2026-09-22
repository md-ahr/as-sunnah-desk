import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-medium">Page not found</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        The page you requested does not exist, or you may not have access to it.
      </p>
      <Link
        href="/requests"
        className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
