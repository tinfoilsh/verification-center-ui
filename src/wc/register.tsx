import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { VerificationCenter } from '../verifier'
import type { VerificationCenterProps } from '../verifier'
import type { VerificationDocument } from '../types/verification'
import { VerifierHeader } from '../verifier-header'
// Import the compiled CSS as a string and inject into shadow root
// Vite will inline the file content with ?raw
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite's ?raw loader returns string
import styles from '../verification-center.css?raw'
// Additional styles used by the flow diagram
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite raw import returns string
import xyflowStyles from '@xyflow/react/dist/style.css?raw'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite raw import returns string
import flowStyles from '../flow/flow.css?raw'

type Props = {
  isDarkMode?: boolean
  showVerificationFlow?: boolean
  verificationDocument?: VerificationDocument
  onRequestVerificationDocument?:
    VerificationCenterProps['onRequestVerificationDocument']
  mode?: 'embedded' | 'sidebar' | 'modal'
  open?: boolean
  sidebarWidth?: number
}

function parseBool(v: unknown, fallback: boolean): boolean {
  if (v == null) return fallback
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  const lower = String(v).toLowerCase()
  if (lower === '' || lower === 'true' || lower === '1' || lower === 'yes') return true
  if (lower === 'false' || lower === '0' || lower === 'no') return false
  return fallback
}

function readBoolAttr(el: Element, name: string, defaultValue: boolean): boolean {
  if (el.hasAttribute(name)) {
    return parseBool(el.getAttribute(name), true)
  }
  return defaultValue
}

function currentProps(el: VerificationCenterElement): Props {
  return {
    isDarkMode: readBoolAttr(el, 'is-dark-mode', true),
    showVerificationFlow: readBoolAttr(el, 'show-verification-flow', true),
    verificationDocument: el.verificationDocument,
    onRequestVerificationDocument: el.onRequestVerificationDocument,
    mode: (el.getAttribute('mode') as Props['mode']) ?? 'embedded',
    open: readBoolAttr(el, 'open', false),
    sidebarWidth:
      el.getAttribute('sidebar-width') != null
        ? Number(el.getAttribute('sidebar-width')) || undefined
        : undefined,
  }
}

class VerificationCenterElement extends HTMLElement {
  static get observedAttributes() {
    return [
      'is-dark-mode',
      'show-verification-flow',
      'mode',
      'open',
      'sidebar-width',
    ]
  }

  private _root?: Root
  private _container?: HTMLElement
  private _styleEl?: HTMLStyleElement
  private _verificationDocument?: Props['verificationDocument']
  private _onRequestVerificationDocument?: Props['onRequestVerificationDocument']
  /** Local cache of last-rendered props to avoid unnecessary renders */
  private _lastProps?: Props
  /** Keydown handler for Escape-to-close when overlays are open */
  private _onKeydown?: (e: KeyboardEvent) => void
  /** Animate open on next frame (mount/enter overlay) */
  private _animateOpenNextFrame?: boolean
  /** RAF id for pending animation scheduling */
  private _rafId?: number

  get verificationDocument(): Props['verificationDocument'] | undefined {
    return this._verificationDocument
  }

  set verificationDocument(v: Props['verificationDocument'] | undefined) {
    this._verificationDocument = v
    this._render()
  }

  get onRequestVerificationDocument():
    | Props['onRequestVerificationDocument']
    | undefined {
    return this._onRequestVerificationDocument
  }

  set onRequestVerificationDocument(
    handler: Props['onRequestVerificationDocument'] | undefined,
  ) {
    this._onRequestVerificationDocument = handler
    this._render()
  }

  get open(): boolean {
    return parseBool(this.getAttribute('open'), false)
  }

  set open(value: boolean) {
    if (value) this.setAttribute('open', '')
    else this.removeAttribute('open')
    // Ensure immediate update even if host set property without attribute mutation batching
    this._render()
  }

  get mode(): Props['mode'] {
    return (this.getAttribute('mode') as Props['mode']) ?? 'embedded'
  }

  set mode(value: Props['mode']) {
    if (value) this.setAttribute('mode', value)
    else this.removeAttribute('mode')
    // Re-render to apply layout/height changes immediately
    this._render()
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }

    if (!this._container) {
      this._container = document.createElement('div')
      // Ensure the host element participates in layout and fills its parent
      // For embedded mode, the host controls layout; for modal/sidebar we render fixed-position wrappers.
      this.style.display = 'block'
      // Make the container fill the host and use a flex column so inner content can scroll
      Object.assign(this._container.style, {
        width: '100%',
        height: 'auto',
        display: 'block',
      })
      // Inject CSS into the shadow root so styles are fully encapsulated
      const base = document.createElement('style')
      base.textContent = String(styles)
      const xy = document.createElement('style')
      xy.textContent = String(xyflowStyles)
      const flow = document.createElement('style')
      flow.textContent = String(flowStyles)
      this._styleEl = base
      this.shadowRoot!.append(base, xy, flow)
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
    // Ensure we drop any global listeners
    if (this._onKeydown) {
      window.removeEventListener('keydown', this._onKeydown)
      this._onKeydown = undefined
    }
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = undefined
    }
  }

  attributeChangedCallback() {
    this._render()
  }

  private _render() {
    if (!this._root) return
    const props = currentProps(this)

    // Avoid re-render if props unchanged (unless we planned an animation tick)
    const prev = this._lastProps
    const propsUnchanged =
      !!prev &&
      prev.isDarkMode === props.isDarkMode &&
      prev.showVerificationFlow === props.showVerificationFlow &&
      prev.onRequestVerificationDocument ===
        props.onRequestVerificationDocument &&
      prev.mode === props.mode &&
      prev.open === props.open &&
      prev.sidebarWidth === props.sidebarWidth &&
      prev.verificationDocument === props.verificationDocument
    if (propsUnchanged && !this._animateOpenNextFrame) {
      return
    }
    this._lastProps = props

    const onClose = () => {
      // Close the component by default when the header close is clicked
      // Consumers can also listen to the 'close' event to update their own state
      this.removeAttribute('open')
      this.dispatchEvent(
        new CustomEvent('close', { bubbles: true, composed: true }),
      )
    }

    // Decide wrapper by mode
    const mode = props.mode ?? 'embedded'
    // Ensure container height matches mode: natural in embedded, 100% for overlays
    if (this._container) {
      this._container.style.height = mode === 'embedded' ? 'auto' : '100%'
    }

    // Manage Escape-to-close listener for overlay modes
    const wantListener = (mode === 'modal' || mode === 'sidebar') && !!props.open
    if (wantListener && !this._onKeydown) {
      this._onKeydown = (e: KeyboardEvent) => {
        if (e.defaultPrevented) return
        if (e.key === 'Escape' || e.code === 'Escape') {
          e.stopPropagation()
          this.removeAttribute('open')
          this.dispatchEvent(
            new CustomEvent('close', { bubbles: true, composed: true }),
          )
        }
      }
      window.addEventListener('keydown', this._onKeydown)
    } else if (!wantListener && this._onKeydown) {
      window.removeEventListener('keydown', this._onKeydown)
      this._onKeydown = undefined
    }

    // Helper to render the inner app (header + center)
    const renderApp = () =>
      React.createElement(
        'div',
        {
          className: 'tinfoil-wc-root',
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            // In embedded mode, allow natural height; otherwise fill the container
            height: mode === 'embedded' ? undefined : '100%',
          },
        },
        [
          React.createElement(VerifierHeader, {
            key: 'header',
            isDarkMode: props.isDarkMode,
            onClose,
            className: 'flex-none',
          }),
          React.createElement(
            'div',
            {
              key: 'content',
              style: mode === 'embedded' ? undefined : { flex: 1, minHeight: 0 },
            },
            React.createElement(VerificationCenter, {
              ...props,
              // For embedded usage, the inner app should not force height:100%
              fillContainer: mode !== 'embedded',
            } as any),
          ),
        ],
      )

    if (mode === 'embedded') {
      // Embedded mode: render inline and allow the element to size naturally
      this._root.render(renderApp())
      return
    }

    // Respect reduced motion preference
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Prepare opening animation on first overlay render with open=true
    const enteringOverlayInitially =
      (mode === 'modal' || mode === 'sidebar') &&
      !!props.open &&
      (!prev || prev.mode === 'embedded') &&
      !this._animateOpenNextFrame
    if (enteringOverlayInitially) {
      // Schedule a second render where styles switch to the open state
      this._animateOpenNextFrame = true
      this._rafId = requestAnimationFrame(() => {
        this._rafId = undefined
        this._animateOpenNextFrame = false
        this._render()
      })
    }

    // For style computation, treat first overlay open as closed for one frame
    const openForStyle = enteringOverlayInitially ? false : !!props.open

    if (mode === 'modal') {
      // Fixed overlay + centered panel
      const panel = React.createElement(
        'div',
        {
          style: {
            width: 'min(720px, 100%)',
            height: 'min(80vh, 680px)',
            borderRadius: 8,
            overflow: 'hidden',
            background: props.isDarkMode ? '#0b0f16' : '#ffffff',
            boxShadow:
              '0 0 0 1px rgba(0,0,0,0.03), 0 25px 50px rgba(0,0,0,0.15)',
            opacity: openForStyle ? 1 : 0.98,
            transform: openForStyle
              ? 'scale(1) translateY(0)'
              : 'scale(0.98) translateY(4px)',
            transition: reducedMotion
              ? 'none'
              : 'transform 250ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease',
          },
          onClick: (e: MouseEvent) => e.stopPropagation(),
        } as any,
        renderApp(),
      )

      const isOpen = openForStyle
      this._root.render(
        React.createElement(
          'div',
          {
            style: {
              position: 'fixed',
              inset: 0,
              background: 'rgba(17,24,39,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              opacity: openForStyle ? 1 : 0,
              pointerEvents: openForStyle ? 'auto' : 'none',
              transition: reducedMotion ? 'none' : 'opacity 200ms ease',
            },
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': 'Tinfoil Verification Center',
            'aria-hidden': openForStyle ? 'false' : 'true',
            onClick: onClose as any,
            onTransitionEnd: (e: TransitionEvent) => {
              // Dispatch 'closed' after fade-out completes
              if (!isOpen && e.propertyName === 'opacity') {
                this.dispatchEvent(
                  new CustomEvent('closed', { bubbles: true, composed: true }),
                )
              }
            },
          } as any,
          panel,
        ),
      )
      return
    }

    // sidebar
    const width = props.sidebarWidth ?? 420
    const isOpen = openForStyle
    this._root.render(
      React.createElement(
        'div',
        {
          style: {
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width,
            maxWidth: '100%',
            background: props.isDarkMode ? '#0b0f16' : '#ffffff',
            boxShadow:
              '0 0 0 1px rgba(0,0,0,0.03), 0 10px 15px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            zIndex: 9999,
            transform: openForStyle ? 'translateX(0)' : 'translateX(100%)',
            pointerEvents: openForStyle ? 'auto' : 'none',
            transition: reducedMotion ? 'none' : 'transform 250ms cubic-bezier(.2,.8,.2,1)',
          },
          role: 'dialog',
          'aria-label': 'Tinfoil Verification Center',
          'aria-hidden': openForStyle ? 'false' : 'true',
          onTransitionEnd: (e: TransitionEvent) => {
            if (!isOpen && e.propertyName === 'transform') {
              this.dispatchEvent(
                new CustomEvent('closed', { bubbles: true, composed: true }),
              )
            }
          },
        } as any,
        renderApp(),
      ),
    )
  }
}

export function defineVerificationCenter(tag = 'tinfoil-verification-center') {
  if (!customElements.get(tag)) {
    customElements.define(tag, VerificationCenterElement)
  }
}

// Auto-define on import for convenience (guard for SSR/Node)
if (typeof customElements !== 'undefined') {
  defineVerificationCenter()
}

declare global {
  interface HTMLElementTagNameMap {
    'tinfoil-verification-center': VerificationCenterElement
  }
}

export * from './tinfoil-badge'
