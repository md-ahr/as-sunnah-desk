'use client'

import { StatusControl } from '@/features/requests/components/status-control'
import type { RequestStatus } from '@/lib/search-params/request-enums'

type RowStatusControlProps = {
  requestId: string
  status: RequestStatus
  version: number
  canEdit: boolean
}

export function RowStatusControl(props: RowStatusControlProps) {
  return <StatusControl {...props} />
}
