import Link from 'next/link'

export default function RequestNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-medium">Request not found</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        It may have been removed, or you may not have access to it.
      </p>
      <Link
        href="/requests"
        className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
      >
        Back to all requests
      </Link>
    </div>
  )
}
