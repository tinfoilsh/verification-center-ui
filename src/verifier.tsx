import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FaGithub } from 'react-icons/fa'
import { LuExternalLink, LuRefreshCcwDot } from 'react-icons/lu'
import type { VerificationDocument } from './types/verification'
export type { VerificationDocument } from './types/verification'
import { CollapsibleFlowDiagram, VerificationFlow } from './flow'
import { MeasurementDiff, ProcessStep } from './steps'
import VerificationStatus from './verification-status'

/**
 * VERIFIER COMPONENT OVERVIEW
 * ==========================
 *
 * This component performs three critical security verifications:
 *
 * 1. REMOTE ATTESTATION (Enclave Verification):
 *    - Fetches attestation from the secure enclave
 *    - Validates signatures from hardware manufacturers (NVIDIA/AMD)
 *    - Extracts the measurement (hash) of code currently running in the enclave
 *
 * 2. CODE INTEGRITY (Source Code Verification):
 *    - Fetches the latest release hash from GitHub
 *    - Retrieves measurement from Sigstore transparency log
 *    - Verifies that GitHub Actions properly built and signed the code
 *
 * 3. CODE CONSISTENCY (Security Verification):
 *    - Compares the enclave measurement with the GitHub Actions/Sigstore measurement
 *    - Ensures the code running in the enclave matches the published and verified source
 *    - Prevents supply chain attacks by confirming code consistency
 *
 * VERIFICATION MODE:
 * This component implements "audit-time verification" - verifying enclave integrity
 * out-of-band rather than during the actual connection. This approach relies on
 * attestation transparency and certificate transparency logs to create an immutable
 * audit trail. Learn more: https://docs.tinfoil.sh/verification/comparison
 *
 * Verification uses the tinfoil package's verifier runner and step updates.
 */

// No local WASM runtime or globals are required.

// Props passed to the main Verification Center component
type VerificationDocumentRequestHandler = () =>
  | VerificationDocument
  | null
  | undefined
  | Promise<VerificationDocument | null | undefined>

export type VerificationCenterProps = {
  isDarkMode?: boolean
  /** Whether to show the verification flow diagram. Defaults to true */
  showVerificationFlow?: boolean
  /** Optional precomputed verification document from client */
  verificationDocument?: VerificationDocument
  /**
   * Optional callback invoked when the user clicks "Verify Again".
   * Should return a fresh verification document (or a promise that resolves to one).
   */
  onRequestVerificationDocument?: VerificationDocumentRequestHandler
  /**
   * When true, the root container stretches to fill its parent (height: 100%).
   * For embedded usage in normal page flow, set false to allow natural height.
   * Defaults to true for sidebar/modal containers that have explicit sizing.
   */
  fillContainer?: boolean
}

type VerificationStatus = 'error' | 'pending' | 'loading' | 'success'

interface MeasurementData {
  measurement?: string
  certificate?: string
}

type VerificationState = {
  code: {
    status: VerificationStatus
    measurements?: MeasurementData
    error?: string
  }
  runtime: {
    status: VerificationStatus
    measurements?: MeasurementData // Changed to MeasurementData to include certificate
    error?: string
  }
  security: {
    status: VerificationStatus
    error?: string
  }
}

const createInitialVerificationState = (): VerificationState => ({
  code: {
    status: 'pending',
    measurements: undefined,
    error: undefined,
  },
  runtime: {
    status: 'pending',
    measurements: undefined,
    error: undefined,
  },
  security: {
    status: 'pending',
    error: undefined,
  },
})

type VerificationStepKey =
  | 'CODE_INTEGRITY'
  | 'REMOTE_ATTESTATION'
  | 'CODE_CONSISTENCY'

const VERIFICATION_STEPS = {
  REMOTE_ATTESTATION: {
    base: 'Enclave Attestation Verification',
    loading: 'Fetching Enclave Attestation...',
    success: 'Enclave Attestation Verified',
    key: 'REMOTE_ATTESTATION' as VerificationStepKey,
  },
  CODE_INTEGRITY: {
    base: 'Source Code Verification',
    loading: 'Fetching Source Code...',
    success: 'Source Code Verified',
    key: 'CODE_INTEGRITY' as VerificationStepKey,
  },
  CODE_CONSISTENCY: {
    base: 'Security Verification',
    loading: 'Checking Measurements...',
    success: 'Security Verified',
    key: 'CODE_CONSISTENCY' as VerificationStepKey,
  },
} as const

const getStepTitle = (
  stepKey: VerificationStepKey,
  status: VerificationStatus,
) => {
  const step = VERIFICATION_STEPS[stepKey]

  switch (status) {
    case 'loading':
      return step.loading
    case 'success':
      return step.success
    default:
      return step.base
  }
}

const createLoadingVerificationState = (): VerificationState => ({
  code: {
    status: 'loading',
    measurements: undefined,
    error: undefined,
  },
  runtime: {
    status: 'loading',
    measurements: undefined,
    error: undefined,
  },
  security: {
    status: 'loading',
    error: undefined,
  },
})

function createUiStateFromDocument(
  document: VerificationDocument,
): VerificationState {
  const codeMeasurements = document.codeMeasurement
    ? { measurement: JSON.stringify(document.codeMeasurement) }
    : undefined

  const runtimeMeasurements = document.enclaveMeasurement?.measurement
    ? {
        measurement: JSON.stringify(document.enclaveMeasurement.measurement),
        certificate: document.enclaveMeasurement.tlsPublicKeyFingerprint,
      }
    : undefined

  return {
    code: {
      status: codeMeasurements ? 'success' : 'error',
      measurements: codeMeasurements,
      error: codeMeasurements
        ? undefined
        : 'Verification document missing code measurement.',
    },
    runtime: {
      status: runtimeMeasurements ? 'success' : 'error',
      measurements: runtimeMeasurements,
      error: runtimeMeasurements
        ? undefined
        : 'Verification document missing runtime measurement.',
    },
    security: {
      status: document.match ? 'success' : 'error',
      error: document.match
        ? undefined
        : 'Runtime and source measurements do not match.',
    },
  }
}

function createErrorVerificationState(
  message: string,
  previous?: VerificationState,
): VerificationState {
  return {
    code: {
      status: 'error',
      measurements: previous?.code.measurements,
      error: message,
    },
    runtime: {
      status: 'error',
      measurements: previous?.runtime.measurements,
      error: message,
    },
    security: {
      status: 'error',
      error: message,
    },
  }
}

export function VerificationCenter({
  isDarkMode = true,
  showVerificationFlow = true,
  verificationDocument,
  onRequestVerificationDocument,
  fillContainer = true,
}: VerificationCenterProps) {
  // Optimistic verifying flag to avoid UI flicker before first update from callback consumers
  const [optimisticVerifying, setOptimisticVerifying] = useState(
    () => !verificationDocument,
  )
  const [isSafari, setIsSafari] = useState(false)
  const [digest, setDigest] = useState<string | null>(
    verificationDocument?.releaseDigest ?? null,
  )
  const [currentDocument, setCurrentDocument] = useState<
    VerificationDocument | undefined
  >(verificationDocument)

  const [verificationState, setVerificationState] = useState<VerificationState>(
    verificationDocument
      ? createUiStateFromDocument(verificationDocument)
      : createInitialVerificationState(),
  )
  const verificationStateRef = useRef(verificationState)
  const hasRequestedInitialDocument = useRef(false)

  useEffect(() => {
    verificationStateRef.current = verificationState
  }, [verificationState])

  // Derived status for the flow diagram; avoid duplicate state by deriving from verificationState
  // Kept as memoized values for clarity and to prevent re-computation on unrelated renders
  const flowStatus = useMemo<'idle' | 'verifying' | 'success' | 'error'>(() => {
    const isAnyLoading =
      verificationState.code.status === 'loading' ||
      verificationState.runtime.status === 'loading' ||
      verificationState.security.status === 'loading'

    const isAnyError =
      verificationState.code.status === 'error' ||
      verificationState.runtime.status === 'error' ||
      verificationState.security.status === 'error'

    const isAllSuccess =
      verificationState.code.status === 'success' &&
      verificationState.runtime.status === 'success' &&
      verificationState.security.status === 'success'

    if (isAnyLoading) return 'verifying'
    if (isAllSuccess) return 'success'
    if (isAnyError) return 'error'
    return 'idle'
  }, [verificationState])

  const isCurrentlyVerifying = useMemo(
    () => optimisticVerifying || flowStatus === 'verifying',
    [optimisticVerifying, flowStatus],
  )

  const refreshButtonClasses = isDarkMode
    ? 'border-border-strong bg-surface-chat text-content-primary hover:bg-surface-chat/80 disabled:cursor-not-allowed disabled:text-content-muted disabled:hover:bg-surface-chat'
    : 'border-border-subtle bg-surface-card text-content-primary hover:bg-surface-card/80 disabled:cursor-not-allowed disabled:text-content-muted disabled:hover:bg-surface-card'

  const secondaryButtonClasses = isDarkMode
    ? 'border-border-subtle bg-transparent text-content-secondary hover:bg-surface-card/80'
    : 'border-border-subtle bg-surface-card text-content-secondary hover:bg-surface-card/80'

  const requestVerificationDocument = useCallback(
    async (forceRefresh = false) => {
      if (!onRequestVerificationDocument) {
        return
      }

      const previousStateSnapshot = verificationStateRef.current

      setOptimisticVerifying(true)

      if (forceRefresh) {
        setCurrentDocument(undefined)
        setDigest(null)
      }

      setVerificationState(createLoadingVerificationState())

      try {
        const result = await Promise.resolve(onRequestVerificationDocument())

        if (result) {
          setCurrentDocument(result)
          setDigest(result.releaseDigest ?? null)
          setVerificationState(createUiStateFromDocument(result))
        } else {
          setVerificationState(
            createErrorVerificationState(
              'No verification document returned.',
              previousStateSnapshot,
            ),
          )
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to refresh verification document.'
        setVerificationState(
          createErrorVerificationState(message, previousStateSnapshot),
        )
      } finally {
        setOptimisticVerifying(false)
      }
    },
    [onRequestVerificationDocument],
  )

  useEffect(() => {
    if (verificationDocument) {
      setCurrentDocument(verificationDocument)
      setDigest(verificationDocument.releaseDigest ?? null)
      setVerificationState(createUiStateFromDocument(verificationDocument))
      setOptimisticVerifying(false)
      hasRequestedInitialDocument.current = true
    } else {
      setCurrentDocument(undefined)
      setDigest(null)
      setVerificationState(createInitialVerificationState())
      if (!onRequestVerificationDocument) {
        setOptimisticVerifying(false)
      }
    }
  }, [verificationDocument, onRequestVerificationDocument])

  useEffect(() => {
    if (verificationDocument) {
      return
    }

    if (
      onRequestVerificationDocument &&
      !hasRequestedInitialDocument.current
    ) {
      hasRequestedInitialDocument.current = true
      void requestVerificationDocument()
    }
  }, [
    verificationDocument,
    onRequestVerificationDocument,
    requestVerificationDocument,
  ])

  // Flow status and verifying spinner are derived via useMemo above

  useEffect(() => {
    // More robust Safari detection
    const isSafariCheck = () => {
      const ua = navigator.userAgent.toLowerCase()
      const isSafariMobile = ua.includes('safari') && ua.includes('mobile')
      const isIOS = /iphone|ipad|ipod/.test(ua)
      return (isSafariMobile || isIOS) && !ua.includes('chrome')
    }

    setIsSafari(isSafariCheck())
  }, [])

  return (
    <div
      className={`tinfoil-verification-theme flex ${
        fillContainer ? 'h-full' : ''
      } w-full flex-col bg-background text-foreground ${
        isDarkMode ? 'dark' : ''
      }`}
      data-theme={isDarkMode ? 'dark' : 'light'}
      style={{ fontFamily: 'inherit' }}
    >
      {/* Fixed Verification Banner */}
      <div className="flex-none">
        <VerificationStatus
          verificationState={verificationState}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Scrollable Content */}
      <div
        className="relative w-full flex-1 overflow-y-auto bg-surface-background"
        style={{
          scrollbarGutter: 'stable',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Scrollable title and description section */}
        <div className="bg-surface-background px-3 py-3 sm:px-4 sm:py-4">
          {/* Title */}
          <div className="mb-3">
            <h3
              className="text-sm font-medium text-content-primary"
              style={{ fontFamily: 'inherit' }}
            >
              Secure Enclave Verifier
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-content-secondary">
            This automated verification tool lets you independently confirm that
            the models are running in secure enclaves, ensuring your
            conversations remain completely private.{' '}
            <a
              href="https://docs.tinfoil.sh/verification/attestation-architecture"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent/80 hover:underline"
            >
              Attestation architecture
              <LuExternalLink className="h-3.5 w-3.5" />
            </a>
          </p>
          {/* Action buttons section */}
          <div className="my-6">
            <div className="flex items-start gap-3">
              <button
                onClick={() => {
                  if (!isCurrentlyVerifying && onRequestVerificationDocument) {
                    // Force a fresh verification when a callback is provided
                    void requestVerificationDocument(true)
                  }
                }}
                disabled={isCurrentlyVerifying || !onRequestVerificationDocument}
                className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${secondaryButtonClasses}`}
                style={{ minWidth: '140px', maxWidth: '180px' }}
              >
                {isCurrentlyVerifying ? (
                  <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                ) : (
                  <LuRefreshCcwDot className="h-4 w-4" />
                )}
                {isCurrentlyVerifying ? 'Verifying...' : 'Verify Again'}
              </button>

              <button
                onClick={() =>
                  window.open(
                    'https://github.com/tinfoilsh/verifier/',
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
                className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${secondaryButtonClasses}`}
                style={{ minWidth: '120px', maxWidth: '160px' }}
              >
                <FaGithub className="h-4 w-4" />
                View Code
              </button>
            </div>
          </div>
        </div>
        {/* Verification Content */}
        <div className="space-y-3 px-3 pb-6 sm:space-y-4 sm:px-4">
          {/* Verification Flow Diagram - Collapsible */}
          {showVerificationFlow && (
            <CollapsibleFlowDiagram
              isDarkMode={isDarkMode}
            >
              <VerificationFlow
                isDarkMode={isDarkMode}
                verificationStatus={flowStatus}
              />
            </CollapsibleFlowDiagram>
          )}

          {/* Process Steps */}
          <ProcessStep
            title={getStepTitle(
              'REMOTE_ATTESTATION',
              verificationState.runtime.status,
            )}
            description="Verifies the secure hardware environment. The response consists of a signed measurement by a combination of NVIDIA, AMD, and Intel certifying the enclave environment and the digest of the binary (i.e., code) actively running inside it."
            status={verificationState.runtime.status}
            error={verificationState.runtime.error}
            measurements={verificationState.runtime.measurements}
            digestType="RUNTIME"
            isDarkMode={isDarkMode}
          />

          <ProcessStep
            title={getStepTitle(
              'CODE_INTEGRITY',
              verificationState.code.status,
            )}
            description="Verifies that the source code published publicly by Tinfoil on GitHub was correctly built through GitHub Actions and that the resulting binary is available on the Sigstore transparency log."
            status={verificationState.code.status}
            error={verificationState.code.error}
            measurements={verificationState.code.measurements}
            digestType="SOURCE"
            verificationDocument={currentDocument}
            githubHash={digest || undefined}
            isDarkMode={isDarkMode}
          />

          <ProcessStep
            title={getStepTitle(
              'CODE_CONSISTENCY',
              verificationState.security.status,
            )}
            description="Verifies that the binary built from the source code matches the binary running in the secure enclave by comparing digests from the enclave and the committed digest from the transparency log."
            status={verificationState.security.status}
            error={verificationState.security.error}
            digestType="CODE_INTEGRITY"
            isDarkMode={isDarkMode}
          >
            {verificationState.code.measurements &&
              verificationState.runtime.measurements && (
                <MeasurementDiff
                  sourceMeasurements={verificationState.code.measurements}
                  runtimeMeasurements={verificationState.runtime.measurements}
                  isVerified={verificationState.security.status === 'success'}
                  isDarkMode={isDarkMode}
                />
              )}
          </ProcessStep>
        </div>
        {isSafari && <div className="h-[30px]" aria-hidden="true" />}{' '}
        {/* Safari-specific spacer */}
      </div>
    </div>
  )
}

export const Verifier = VerificationCenter

export default VerificationCenter
