'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type LoginFieldProps = {
  label: string
  name: string
  type?: 'email' | 'password' | 'text'
  autoComplete?: string
  required?: boolean
  error?: string
}

export function LoginField({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  error,
}: LoginFieldProps) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn('h-10 px-3', error && 'border-destructive')}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
