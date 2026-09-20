import { cleanup, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LoginForm } from '@/features/auth/components/login-form'

vi.mock('../actions/login', () => ({
  login: vi.fn(),
}))

describe('LoginForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders labelled email and password fields with a submit button', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('Email', { exact: true })).toBeInTheDocument()
    expect(screen.getByLabelText('Password', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<LoginForm />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
