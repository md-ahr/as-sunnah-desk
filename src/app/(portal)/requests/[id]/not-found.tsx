import { NotFoundPage } from '@/components/not-found-page'

export default function RequestNotFound() {
  return (
    <NotFoundPage
      headingLevel="h2"
      title="Request not found"
      description="It may have been removed, or you may not have access to it."
      actionLabel="Back to all requests"
      actionHref="/requests"
    />
  )
}
