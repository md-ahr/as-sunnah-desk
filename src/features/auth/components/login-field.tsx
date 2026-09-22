'use client'

import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  const isPassword = type === 'password'
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={isPassword && visible ? 'text' : type}
          autoComplete={autoComplete}
          required={required}
          spellCheck={isPassword ? false : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn('h-10 px-3', isPassword && 'pr-10', error && 'border-destructive')}
        />
        {isPassword ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground absolute top-1/2 right-1.5 -translate-y-1/2 transition-[color,background-color,box-shadow,border-color,opacity] active:-translate-y-1/2!"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            aria-controls={name}
            onMouseDown={(event) => {
              event.preventDefault()
            }}
            onClick={() => {
              setVisible((current) => !current)
            }}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
