export type ActivityEntryDto = {
  readonly id: string
  readonly requestId: string
  readonly type: 'created' | 'status_changed' | 'assigned' | 'unassigned' | 'commented'
  readonly field: string | null
  readonly fromValue: string | null
  readonly toValue: string | null
  readonly comment: string | null
  readonly createdAt: Date
  readonly actor: {
    readonly id: string
    readonly name: string
    readonly email: string
  }
}
