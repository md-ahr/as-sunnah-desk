import type { Metadata } from 'next'
import { Suspense } from 'react'

import {
  RequestDetail,
  generateRequestDetailMetadata,
} from '@/features/requests/components/request-detail'
import { RequestDetailSkeleton } from '@/features/requests/components/request-detail-skeleton'

export async function generateMetadata(props: PageProps<'/requests/[id]'>): Promise<Metadata> {
  return generateRequestDetailMetadata(props.params)
}

export default function RequestDetailPage(props: PageProps<'/requests/[id]'>) {
  return (
    <Suspense fallback={<RequestDetailSkeleton />}>
      <RequestDetail params={props.params} />
    </Suspense>
  )
}
