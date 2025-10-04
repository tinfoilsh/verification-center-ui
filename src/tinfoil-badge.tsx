import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LuShieldCheck, LuShieldAlert } from 'react-icons/lu'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import clsx from 'clsx'

export type TinfoilBadgeElement = HTMLElement & {
  state?: 'idle' | 'loading' | 'success' | 'error'
  errorMessage?: string
  onClick?: () => void
  isDarkMode?: boolean
  verificationDocument?: any
}

type BadgeState = 'idle' | 'loading' | 'success' | 'error'

function TinfoilBadgeComponent() {
  const [state, setState] = useState<BadgeState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [verificationDocument, setVerificationDocument] = useState<any>(null)
  const hostRef = useRef<TinfoilBadgeElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const observer = new MutationObserver(() => {
      const newState = host.state || 'idle'
      const newError = host.errorMessage || null
      const newDarkMode = host.isDarkMode ?? true
      const newDoc = host.verificationDocument
      setState(newState)
      setErrorMessage(newError)
      setIsDarkMode(newDarkMode)
      setVerificationDocument(newDoc)
    })

    observer.observe(host, { attributes: true })

    setState(host.state || 'idle')
    setErrorMessage(host.errorMessage || null)
    setIsDarkMode(host.isDarkMode ?? true)
    setVerificationDocument(host.verificationDocument)

    return () => observer.disconnect()
  }, [])

  const handleClick = () => {
    const host = hostRef.current
    if (host?.onClick) {
      host.onClick()
    }
    host?.dispatchEvent(new CustomEvent('badge-click', { bubbles: true, composed: true }))
  }

  const { computedState, label } = useMemo(() => {
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

  const tooltip = useMemo(() => {
    if (computedState === 'error') {
      return errorMessage ?? 'Verification unavailable'
    }
    return label
  }, [errorMessage, label, computedState])

  const icon = useMemo(() => {
    if (computedState === 'loading') {
      return <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
    }
    if (computedState === 'error') {
      return <LuShieldAlert className="h-4 w-4" />
    }
    return <LuShieldCheck className="h-4 w-4" />
  }, [computedState])

  const buttonClass = clsx(
    'tinfoil-verification-theme inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors',
    isDarkMode
      ? 'border-border-subtle bg-transparent text-content-secondary hover:bg-surface-card/80'
      : 'border-border-subtle bg-surface-card text-content-secondary hover:bg-surface-card/80'
  )

  return (
    <div ref={hostRef as React.RefObject<HTMLDivElement>} className={isDarkMode ? 'dark' : ''}>
      <button
        type="button"
        className={buttonClass}
        title={tooltip}
        onClick={handleClick}
        disabled={computedState === 'loading'}
      >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
      </button>
    </div>
  )
}

export class TinfoilBadge extends HTMLElement {
  private root: ReturnType<typeof createRoot> | null = null
  private _state: BadgeState = 'idle'
  private _errorMessage: string | null = null
  private _isDarkMode: boolean = true
  private _verificationDocument: any = null

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
    this.render()
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
    this.render()
  }

  connectedCallback() {
    this.render()
  }

  disconnectedCallback() {
    this.root?.unmount()
    this.root = null
  }

  private render() {
    if (!this.shadowRoot) return

    if (!this.root) {
      const container = document.createElement('div')
      this.shadowRoot.appendChild(container)
      this.root = createRoot(container)
    }

    this.root.render(<TinfoilBadgeComponent />)
  }
}

if (!customElements.get('tinfoil-badge')) {
  customElements.define('tinfoil-badge', TinfoilBadge)
}

declare global {
  interface HTMLElementTagNameMap {
    'tinfoil-badge': TinfoilBadgeElement
  }
}
