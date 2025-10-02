import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// Import the Web Component bundle to define the custom element globally
import '@tinfoilsh/verification-center-ui'
import { mockFailureDocument, mockSuccessDocument } from './fake-document'

type DisplayMode = 'sidebar' | 'modal'
type MockOutcome = 'success' | 'failure'

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showFlow, setShowFlow] = useState(true)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('sidebar')
  const [isVerifierOpen, setIsVerifierOpen] = useState(true)
  const [mockOutcome, setMockOutcome] = useState<MockOutcome>('success')

  const verificationDocument = useMemo(
    () => (mockOutcome === 'success' ? mockSuccessDocument : mockFailureDocument),
    [mockOutcome],
  )

  const handleModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode)
    setIsVerifierOpen(true)
  }, [])

  const handleToggleVerifier = useCallback(() => {
    setIsVerifierOpen((current) => !current)
  }, [])

  const appClassName = useMemo(
    () => (isDarkMode ? 'app app--dark' : 'app'),
    [isDarkMode],
  )

  // Web Component host container
  const wcHostRef = useRef<HTMLDivElement | null>(null)
  const wcElRef = useRef<HTMLElement | null>(null)

  // Create/remove the element as the demo opens/closes
  useEffect(() => {
    const host = wcHostRef.current
    if (!host) return

    if (isVerifierOpen) {
      // Create if missing
      if (!wcElRef.current) {
        wcElRef.current = document.createElement('tinfoil-verification-center') as any
      }
      // Ensure appended to current host
      if (wcElRef.current.parentElement !== host) {
        host.appendChild(wcElRef.current)
      }
      // Wire close event from WC header
      const handleClose = () => setIsVerifierOpen(false)
      wcElRef.current.addEventListener('close', handleClose)
      return () => {
        wcElRef.current?.removeEventListener('close', handleClose)
      }
    }

    if (!isVerifierOpen && wcElRef.current) {
      wcElRef.current.remove()
      wcElRef.current = null
    }
  }, [isVerifierOpen, displayMode])

  // Keep WC props in sync with controls
  useEffect(() => {
    const el = wcElRef.current as any
    if (!el) return
    el.setAttribute('is-dark-mode', String(isDarkMode))
    el.setAttribute('show-verification-flow', String(showFlow))
    el.verificationDocument = verificationDocument
  }, [isDarkMode, showFlow, verificationDocument, isVerifierOpen])

  return (
    <div className={appClassName}>
      <aside className="app__sidebar">
        <h1>Verification Center Demo</h1>
        <button type="button" onClick={handleToggleVerifier}>
          {isVerifierOpen ? 'Hide Verification Center' : 'Show Verification Center'}
        </button>

        <section className="app__controls">
          <label>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={(event) => setIsDarkMode(event.target.checked)}
            />
            Dark mode
          </label>

          <label>
            <input
              type="checkbox"
              checked={showFlow}
              onChange={(event) => setShowFlow(event.target.checked)}
            />
            Show verification flow
          </label>

          <div className="app__group">
            <p>Mock outcome</p>
            <label>
              <input
                type="radio"
                name="mock-outcome"
                value="success"
                checked={mockOutcome === 'success'}
                onChange={() => setMockOutcome('success')}
              />
              Success document
            </label>
            <label>
              <input
                type="radio"
                name="mock-outcome"
                value="failure"
                checked={mockOutcome === 'failure'}
                onChange={() => setMockOutcome('failure')}
              />
              Failure document
            </label>
          </div>

          <div className="app__group">
            <p>Display mode</p>
            <label>
              <input
                type="radio"
                name="display-mode"
                value="sidebar"
                checked={displayMode === 'sidebar'}
                onChange={() => handleModeChange('sidebar')}
              />
              Sidebar
            </label>
            <label>
              <input
                type="radio"
                name="display-mode"
                value="modal"
                checked={displayMode === 'modal'}
                onChange={() => handleModeChange('modal')}
              />
              Modal
            </label>
            
          </div>
        </section>
      </aside>

      <main className="app__main">Webpage</main>

      {displayMode === 'sidebar' && isVerifierOpen ? (
        <div
          className="wc-sidebar"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: 420,
            maxWidth: '100%',
            borderLeft: '1px solid #e5e7eb',
            background: isDarkMode ? '#0b0f16' : '#ffffff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 10px 15px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            zIndex: 40,
          }}
        >
          <div
            ref={wcHostRef}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      ) : null}

      {displayMode === 'modal' && isVerifierOpen ? (
        <div
          className="wc-overlay"
          onClick={() => setIsVerifierOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,24,39,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            className="wc-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(720px, 100%)',
              height: 'min(80vh, 680px)',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              background: isDarkMode ? '#0b0f16' : '#ffffff',
              boxShadow:
                '0 0 0 1px rgba(0,0,0,0.03), 0 25px 50px rgba(0,0,0,0.15)',
            }}
          >
            <div ref={wcHostRef} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
