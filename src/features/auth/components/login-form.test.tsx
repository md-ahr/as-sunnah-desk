import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

  it('toggles password visibility without submitting the form', () => {
    render(<LoginForm />)

    const password = screen.getByLabelText('Password', { exact: true })
    expect(password).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))

    expect(password).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<LoginForm />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
