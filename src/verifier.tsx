import { useCallback, useEffect, useRef, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FaGithub } from 'react-icons/fa'
import { LuExternalLink, LuRefreshCcwDot } from 'react-icons/lu'
import type {
  VerificationDocument,
  VerificationStepStatus,
  VerificationUiState,
} from './types/verification'
export type { VerificationDocument } from './types/verification'
import { CollapsibleFlowDiagram, VerificationFlow } from './flow'
import { MeasurementDiff, ProcessStep } from './steps'
import VerificationStatus from './verification-status'

// Props passed to the main Verification Center component
type VerificationDocumentRequestHandler = () =>
  | VerificationDocument
  | null
  | undefined
  | Promise<VerificationDocument | null | undefined>

export type VerificationCenterProps = {
  isDarkMode?: boolean
  showVerificationFlow?: boolean
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

const createInitialUiState = (): VerificationUiState => ({
  summary: {
    status: 'progress',
    message: 'Awaiting verification document.',
  },
  flowStatus: 'idle',
  steps: {
    runtime: { status: 'pending' },
    code: { status: 'pending' },
    security: { status: 'pending' },
  },
})

const createLoadingUiState = (
  previous?: VerificationUiState,
): VerificationUiState => {
  const base = previous ?? createInitialUiState()

  return {
    summary: {
      status: 'progress',
      message: 'Refreshing verification document...',
    },
    flowStatus: 'verifying',
    steps: {
      runtime: {
        ...base.steps.runtime,
        status: 'loading',
        error: undefined,
      },
      code: {
        ...base.steps.code,
        status: 'loading',
        error: undefined,
      },
      security: {
        ...base.steps.security,
        status: 'loading',
        error: undefined,
      },
    },
  }
}

const createErrorUiState = (
  message: string,
  previous?: VerificationUiState,
): VerificationUiState => {
  const base = previous ?? createInitialUiState()

  return {
    summary: {
      status: 'error',
      message,
    },
    flowStatus: 'error',
    steps: {
      runtime: {
        ...base.steps.runtime,
        status: 'error',
        error: message,
      },
      code: {
        ...base.steps.code,
        status: 'error',
        error: message,
      },
      security: {
        ...base.steps.security,
        status: 'error',
        error: message,
      },
    },
  }
}

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
  status: VerificationStepStatus,
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

function createUiStateFromDocument(
  document: VerificationDocument,
): VerificationUiState {
  if (!document.ui) {
    return createErrorUiState(
      'Verification document missing precomputed UI state.',
    )
  }

  return document.ui
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
    verificationDocument?.releaseDigest ??
      verificationDocument?.ui?.steps.code.githubHash ??
      null,
  )
  const [currentDocument, setCurrentDocument] = useState<
    VerificationDocument | undefined
  >(verificationDocument)

  const [uiState, setUiState] = useState<VerificationUiState>(
    verificationDocument
      ? createUiStateFromDocument(verificationDocument)
      : createInitialUiState(),
  )
  const uiStateRef = useRef(uiState)
  const hasRequestedInitialDocument = useRef(false)

  useEffect(() => {
    uiStateRef.current = uiState
  }, [uiState])

  const flowStatus = uiState.flowStatus

  const isCurrentlyVerifying = optimisticVerifying || flowStatus === 'verifying'

  const secondaryButtonClasses = isDarkMode
    ? 'border-border-subtle bg-transparent text-content-secondary hover:bg-surface-card/80'
    : 'border-border-subtle bg-surface-card text-content-secondary hover:bg-surface-card/80'

  const { runtime, code, security } = uiState.steps
  const comparison = security.comparison
  const githubHash = code.githubHash ?? digest ?? undefined

  const requestVerificationDocument = useCallback(
    async (forceRefresh = false) => {
      if (!onRequestVerificationDocument) {
        return
      }

      const previousStateSnapshot = uiStateRef.current

      setOptimisticVerifying(true)

      if (forceRefresh) {
        setCurrentDocument(undefined)
        setDigest(null)
      }

      setUiState((previous) => createLoadingUiState(previous))

      try {
        const result = await Promise.resolve(onRequestVerificationDocument())

        if (result) {
          setCurrentDocument(result)
          setDigest(
            result.releaseDigest ??
              result.ui?.steps.code.githubHash ??
              null,
          )
          setUiState(createUiStateFromDocument(result))
        } else {
          setUiState(
            createErrorUiState(
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
        setUiState(
          createErrorUiState(message, previousStateSnapshot),
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
      setDigest(
        verificationDocument.releaseDigest ??
          verificationDocument.ui?.steps.code.githubHash ??
          null,
      )
      setUiState(createUiStateFromDocument(verificationDocument))
      setOptimisticVerifying(false)
      hasRequestedInitialDocument.current = true
    } else {
      setCurrentDocument(undefined)
      setDigest(null)
      setUiState(createInitialUiState())
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
          summary={uiState.summary}
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
              runtime.status,
            )}
            description="Verifies the secure hardware environment. The response consists of a signed measurement by a combination of NVIDIA, AMD, and Intel certifying the enclave environment and the digest of the binary (i.e., code) actively running inside it."
            status={runtime.status}
            error={runtime.error}
            measurement={runtime.measurement}
            digestType="RUNTIME"
            isDarkMode={isDarkMode}
          />

          <ProcessStep
            title={getStepTitle(
              'CODE_INTEGRITY',
              code.status,
            )}
            description="Verifies that the source code published publicly by Tinfoil on GitHub was correctly built through GitHub Actions and that the resulting binary is available on the Sigstore transparency log."
            status={code.status}
            error={code.error}
            measurement={code.measurement}
            digestType="SOURCE"
            verificationDocument={currentDocument}
            githubHash={githubHash}
            isDarkMode={isDarkMode}
          />

          <ProcessStep
            title={getStepTitle(
              'CODE_CONSISTENCY',
              security.status,
            )}
            description="Verifies that the binary built from the source code matches the binary running in the secure enclave by comparing digests from the enclave and the committed digest from the transparency log."
            status={security.status}
            error={security.error}
            digestType="CODE_INTEGRITY"
            isDarkMode={isDarkMode}
          >
            {comparison && (
              <MeasurementDiff
                sourceMeasurements={
                  comparison.sourceMeasurements ?? code.measurement ?? ''
                }
                runtimeMeasurements={
                  comparison.runtimeMeasurements ?? runtime.measurement ?? ''
                }
                isVerified={comparison.isVerified}
                isDarkMode={isDarkMode}
                showStatusBanner={comparison.isVerified}
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
