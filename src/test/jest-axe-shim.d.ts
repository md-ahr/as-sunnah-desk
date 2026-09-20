declare module 'jest-axe' {
  export function axe(container: Element): Promise<{
    violations: unknown[]
  }>
}
