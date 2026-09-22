import { NotFoundPage } from '@/components/not-found-page'

export default function NotFound() {
  return (
    <NotFoundPage
      fullPage
      statusCode="404"
      title="Page not found"
      description="The page you requested does not exist, or you may not have access to it."
      actionLabel="Back to dashboard"
      actionHref="/requests"
    />
  )
}
