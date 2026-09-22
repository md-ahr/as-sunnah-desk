import type { ReactNode } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AssigneeControl } from '@/features/requests/components/assignee-control'
import { PriorityBadge } from '@/features/requests/components/priority-badge'
import { StatusControl } from '@/features/requests/components/status-control'
import { RequestMutationVersionProvider } from '@/features/requests/hooks/use-mutation-version'
import { LocalTimestamp } from '@/features/requests/components/local-timestamp'
import { initials } from '@/features/requests/lib/labels'
import type { AssigneeOption, RequestDetailDto } from '@/features/requests/types'

type RequestDetailPanelProps = {
  request: RequestDetailDto
  canEditStatus: boolean
  canEditAssignee: boolean
  assigneeOptions: readonly AssigneeOption[]
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

function Timestamp({ date }: { date: Date }) {
  return <LocalTimestamp date={date} className="tabular-nums" />
}

export function RequestDetailPanel({
  request,
  canEditStatus,
  canEditAssignee,
  assigneeOptions,
}: RequestDetailPanelProps) {
  return (
    <RequestMutationVersionProvider requestId={request.id} version={request.version}>
      <article className="border-border bg-card rounded-lg border">
        <header className="space-y-4 p-6 pb-0">
          <p className="text-muted-foreground font-mono text-xs tracking-wide">
            {request.reference}
          </p>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {request.subject}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusControl
                requestId={request.id}
                status={request.status}
                version={request.version}
                canEdit={canEditStatus}
              />
              <PriorityBadge priority={request.priority} />
            </div>
          </div>
        </header>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 gap-8 px-6 pb-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section aria-labelledby="request-description-heading">
            <h2
              id="request-description-heading"
              className="text-muted-foreground text-xs font-medium"
            >
              Description
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-pretty whitespace-pre-wrap">
              {request.description}
            </p>
          </section>

          <aside className="bg-muted/40 border-border/60 rounded-md border p-4 lg:self-start">
            <dl className="space-y-5">
              <DetailField label="Category">{request.category.name}</DetailField>
              <DetailField label="Requester">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {initials(request.requester.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{request.requester.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {request.requester.email}
                    </p>
                  </div>
                </div>
              </DetailField>
              <DetailField label="Assignee">
                <AssigneeControl
                  requestId={request.id}
                  assignee={request.assignee}
                  version={request.version}
                  canEdit={canEditAssignee}
                  options={assigneeOptions}
                  showTrigger
                />
              </DetailField>
            </dl>
            <dl className="border-border mt-5 space-y-5 border-t pt-5">
              <DetailField label="Created">
                <Timestamp date={request.createdAt} />
              </DetailField>
              <DetailField label="Updated">
                <Timestamp date={request.updatedAt} />
              </DetailField>
              {request.resolvedAt ? (
                <DetailField label="Resolved at">
                  <Timestamp date={request.resolvedAt} />
                </DetailField>
              ) : null}
            </dl>
          </aside>
        </div>
      </article>
    </RequestMutationVersionProvider>
  )
}
