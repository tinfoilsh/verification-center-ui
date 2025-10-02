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

  // Ref the custom element to set the document and listen for close
  const wcRef = useRef<any>(null)
  useEffect(() => {
    const el = wcRef.current as any
    if (!el) return
    const handleClose = () => setIsVerifierOpen(false)
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [])

  useEffect(() => {
    const el = wcRef.current as any
    if (!el) return
    el.verificationDocument = verificationDocument
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
            
          </div>
        </section>
      </aside>

      <main className="app__main">Webpage</main>

      {/* Single custom element handles sidebar or modal */}
      <tinfoil-verification-center
        ref={wcRef}
        mode={displayMode}
        open={isVerifierOpen as unknown as any}
        is-dark-mode={isDarkMode ? 'true' : 'false'}
        show-verification-flow={showFlow ? 'true' : 'false'}
      />
    </div>
  )
}

export default App
