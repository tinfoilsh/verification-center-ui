import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@tinfoilsh/verification-center-ui'
import { mockFailureDocument, mockSuccessDocument } from './fake-document'

type DisplayMode = 'sidebar' | 'modal' | 'embedded'
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

  // Callback ref to always bind/unbind listeners on the latest element instance
  const wcRef = useRef<any>(null)
  const setWcRef = useCallback((el: any) => {
    // Unbind from previous instance
    if (wcRef.current) {
      wcRef.current.removeEventListener('close', onClose)
    }
    wcRef.current = el
    if (el) {
      el.addEventListener('close', onClose)
      // Keep document in sync on mount
      el.verificationDocument = verificationDocument
      el.onRequestVerificationDocument = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return verificationDocument
      }
    }
  }, [verificationDocument])

  const onClose = useCallback(() => setIsVerifierOpen(false), [])

  const badgeRef = useRef<any>(null)
  const setBadgeRef = useCallback((el: any) => {
    badgeRef.current = el
    if (el) {
      el.verificationDocument = verificationDocument
      el.onClick = () => {
        setIsVerifierOpen(true)
      }
    }
  }, [verificationDocument])

  useEffect(() => {
    if (badgeRef.current) {
      badgeRef.current.verificationDocument = verificationDocument
    }
  }, [verificationDocument])

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
            <label>
              <input
                type="radio"
                name="display-mode"
                value="embedded"
                checked={displayMode === 'embedded'}
                onChange={() => handleModeChange('embedded')}
              />
              Embedded
            </label>
          </div>

        </section>
      </aside>

      <main className="app__main">
        <div style={{ padding: '20px' }}>
          <h2>Tinfoil Badge</h2>
          <tinfoil-badge ref={setBadgeRef as any} />
        </div>
      </main>

      {/* Always render the element; toggle visibility via `open` for overlays */}
      <tinfoil-verification-center
        ref={setWcRef as any}
        mode={displayMode}
        open={displayMode !== 'embedded' ? (isVerifierOpen as unknown as any) : undefined}
        is-dark-mode={isDarkMode ? 'true' : 'false'}
        show-verification-flow={showFlow ? 'true' : 'false'}
        style={
          displayMode === 'embedded'
            ? ({
                width: 'min(720px, 100%)',
                height: 'min(80vh, 680px)',
                borderRadius: 8,
                overflow: 'hidden',
              } as React.CSSProperties)
            : undefined
        }
      />
    </div>
  )
}

export default App
