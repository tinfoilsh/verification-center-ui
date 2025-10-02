declare module '*.css'

// Allow using the custom element in TSX without type errors
import type React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'tinfoil-verification-center': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'is-dark-mode'?: boolean | string
        'show-verification-flow'?: boolean | string
        'config-repo'?: string
        'base-url'?: string
        mode?: 'embedded' | 'sidebar' | 'modal'
        open?: boolean | string
        'sidebar-width'?: number | string
      }
    }
  }
}
