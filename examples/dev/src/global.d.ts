import type React from 'react'

declare module '*.css'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'tinfoil-verification-center': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'is-dark-mode'?: boolean | string
        'show-verification-flow'?: boolean | string
        mode?: 'embedded' | 'sidebar' | 'modal'
        open?: boolean | string
        'sidebar-width'?: number | string
      }
      'tinfoil-badge': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        state?: 'idle' | 'loading' | 'success' | 'error'
        'error-message'?: string
        'is-dark-mode'?: boolean | string
      }
    }
  }
}

export {}
