import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { VerificationCenter } from '../verifier'
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
  verificationDocument?: import('tinfoil').VerificationDocument
  configRepo?: string
  baseUrl?: string
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

function currentProps(el: VerificationCenterElement): Props {
  return {
    isDarkMode: parseBool(el.getAttribute('is-dark-mode'), true),
    showVerificationFlow: parseBool(el.getAttribute('show-verification-flow'), true),
    configRepo: el.getAttribute('config-repo') ?? undefined,
    baseUrl: el.getAttribute('base-url') ?? undefined,
    verificationDocument: el.verificationDocument,
  }
}

class VerificationCenterElement extends HTMLElement {
  static get observedAttributes() {
    return ['is-dark-mode', 'show-verification-flow', 'config-repo', 'base-url']
  }

  private _root?: Root
  private _container?: HTMLElement
  private _styleEl?: HTMLStyleElement
  private _verificationDocument?: Props['verificationDocument']

  get verificationDocument(): Props['verificationDocument'] | undefined {
    return this._verificationDocument
  }

  set verificationDocument(v: Props['verificationDocument'] | undefined) {
    this._verificationDocument = v
    this._render()
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }

    if (!this._container) {
      this._container = document.createElement('div')
      // Ensure the host element participates in layout and fills its parent
      this.style.display = 'block'
      this.style.width = '100%'
      this.style.height = '100%'
      // Make the container fill the host and use a flex column so inner content can scroll
      Object.assign(this._container.style, {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
  }

  attributeChangedCallback() {
    this._render()
  }

  private _render() {
    if (!this._root) return
    const props = currentProps(this)
    // Render a small wrapper that adds the standard header and hosts the verifier
    const onClose = () => {
      // Emit a custom event so host pages can react (e.g., hide sidebar/modal)
      this.dispatchEvent(new CustomEvent('close', { bubbles: true }))
    }
    this._root.render(
      React.createElement(
        'div',
        {
          className: 'tinfoil-wc-root',
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
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
              style: { flex: 1, minHeight: 0 },
            },
            React.createElement(VerificationCenter, props),
          ),
        ],
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
