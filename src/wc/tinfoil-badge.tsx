import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { IoShieldCheckmarkOutline } from 'react-icons/io5'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { LuShieldAlert } from 'react-icons/lu'
import clsx from 'clsx'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite's ?raw loader returns string
import styles from '../verification-center.css?raw'

type BadgeState = 'idle' | 'loading' | 'success' | 'error'

type BadgeProps = {
  state?: BadgeState
  errorMessage?: string
  isDarkMode?: boolean
  verificationDocument?: any
}

function TinfoilBadgeComponent({ state = 'idle', errorMessage, isDarkMode = true, verificationDocument }: BadgeProps) {
  const { computedState, label } = React.useMemo(() => {
    if (verificationDocument) {
      const allSuccess =
        verificationDocument.steps?.fetchDigest?.status === 'success' &&
        verificationDocument.steps?.verifyCode?.status === 'success' &&
        verificationDocument.steps?.verifyEnclave?.status === 'success' &&
        verificationDocument.steps?.compareMeasurements?.status === 'success'

      const hasError =
        verificationDocument.steps?.fetchDigest?.status === 'failed' ||
        verificationDocument.steps?.verifyCode?.status === 'failed' ||
        verificationDocument.steps?.verifyEnclave?.status === 'failed' ||
        verificationDocument.steps?.compareMeasurements?.status === 'failed'

      if (allSuccess) {
        return { computedState: 'success' as BadgeState, label: 'Enclave verified' }
      }
      if (hasError) {
        return { computedState: 'error' as BadgeState, label: 'Verification failed' }
      }
      return { computedState: 'loading' as BadgeState, label: 'Verifying...' }
    }

    if (state === 'success') return { computedState: state, label: 'Enclave verified' }
    if (state === 'loading') return { computedState: state, label: 'Verifying...' }
    if (state === 'error') return { computedState: state, label: 'Verification failed' }
    return { computedState: state, label: 'Verify enclave' }
  }, [state, verificationDocument])

  const tooltip = React.useMemo(() => {
    if (computedState === 'error') {
      return errorMessage ?? 'Verification unavailable'
    }
    return label
  }, [errorMessage, label, computedState])

  const icon = React.useMemo(() => {
    if (computedState === 'loading') {
      return React.createElement(AiOutlineLoading3Quarters, { className: 'h-4 w-4 animate-spin' })
    }
    if (computedState === 'error') {
      return React.createElement(LuShieldAlert, { className: 'h-4 w-4' })
    }
    return React.createElement(IoShieldCheckmarkOutline, { className: 'h-4 w-4' })
  }, [computedState])

  const buttonClass = clsx(
    'tinfoil-verification-theme inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-normal transition-colors',
    {
      'border-emerald-600/30 bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20': computedState === 'success' && isDarkMode,
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20': computedState === 'success' && !isDarkMode,
      'border-red-600/30 bg-red-600/10 text-red-600 hover:bg-red-600/20': computedState === 'error' && isDarkMode,
      'border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20': computedState === 'error' && !isDarkMode,
      'border-border-subtle bg-transparent text-content-secondary hover:bg-surface-card/80': (computedState === 'idle' || computedState === 'loading') && isDarkMode,
      'border-border-subtle bg-surface-card text-content-secondary hover:bg-surface-card/80': (computedState === 'idle' || computedState === 'loading') && !isDarkMode,
    }
  )

  return React.createElement(
    'div',
    { className: isDarkMode ? 'dark' : '' },
    React.createElement(
      'button',
      {
        type: 'button',
        className: buttonClass,
        title: tooltip,
        disabled: computedState === 'loading',
      },
      icon,
      React.createElement('span', { className: 'whitespace-nowrap' }, label)
    )
  )
}

export type TinfoilBadgeElement = HTMLElement & {
  state?: BadgeState
  errorMessage?: string
  isDarkMode?: boolean
  verificationDocument?: any
  onClick?: () => void
}

class TinfoilBadgeCustomElement extends HTMLElement {
  private _root?: Root
  private _container?: HTMLElement
  private _state: BadgeState = 'idle'
  private _errorMessage: string | null = null
  private _isDarkMode: boolean = true
  private _verificationDocument: any = null
  private _onClick?: () => void

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  get state(): BadgeState {
    return this._state
  }

  set state(value: BadgeState) {
    this._state = value
    this.setAttribute('state', value)
  }

  get errorMessage(): string | null {
    return this._errorMessage
  }

  set errorMessage(value: string | null) {
    this._errorMessage = value
    if (value) {
      this.setAttribute('error-message', value)
    } else {
      this.removeAttribute('error-message')
    }
  }

  get isDarkMode(): boolean {
    return this._isDarkMode
  }

  set isDarkMode(value: boolean) {
    this._isDarkMode = value
    if (value) {
      this.setAttribute('is-dark-mode', 'true')
    } else {
      this.setAttribute('is-dark-mode', 'false')
    }
  }

  get verificationDocument(): any {
    return this._verificationDocument
  }

  set verificationDocument(value: any) {
    this._verificationDocument = value
    this._render()
  }

  get onClick(): (() => void) | undefined {
    return this._onClick
  }

  set onClick(handler: (() => void) | undefined) {
    this._onClick = handler
  }

  static get observedAttributes() {
    return ['state', 'error-message', 'is-dark-mode']
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'state') {
      this._state = (newValue as BadgeState) || 'idle'
    } else if (name === 'error-message') {
      this._errorMessage = newValue
    } else if (name === 'is-dark-mode') {
      this._isDarkMode = newValue === 'true'
    }
    this._render()
  }

  connectedCallback() {
    if (!this._container) {
      this._container = document.createElement('div')

      const styleEl = document.createElement('style')
      styleEl.textContent = String(styles)

      this.shadowRoot!.append(styleEl)
      this.shadowRoot!.appendChild(this._container)
    }

    if (!this._root) {
      this._root = createRoot(this._container!)
    }

    this._render()
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount()
      this._root = undefined
    }
  }

  private _render() {
    if (!this._root || !this._container) return

    const handleClick = () => {
      if (this._onClick) {
        this._onClick()
      }
      this.dispatchEvent(new CustomEvent('badge-click', { bubbles: true, composed: true }))
    }

    const wrapper = React.createElement(
      'div',
      { onClick: handleClick },
      React.createElement(TinfoilBadgeComponent, {
        state: this._state,
        errorMessage: this._errorMessage ?? undefined,
        isDarkMode: this._isDarkMode,
        verificationDocument: this._verificationDocument,
      })
    )

    this._root.render(wrapper)
  }
}

export function defineTinfoilBadge(tag = 'tinfoil-badge') {
  if (!customElements.get(tag)) {
    customElements.define(tag, TinfoilBadgeCustomElement)
  }
}

if (typeof customElements !== 'undefined') {
  defineTinfoilBadge()
}

declare global {
  interface HTMLElementTagNameMap {
    'tinfoil-badge': TinfoilBadgeElement
  }
}
