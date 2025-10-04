import { useCallback, useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FaGithub } from 'react-icons/fa'
import { LuExternalLink, LuRefreshCcwDot } from 'react-icons/lu'
import type { VerificationDocument } from './types/verification'
export type { VerificationDocument } from './types/verification'
import { CollapsibleFlowDiagram, VerificationFlow } from './flow'
import { MeasurementDiff, ProcessStep } from './steps'
import VerificationStatus from './verification-status'

export type VerificationCenterProps = {
  /** The verification document to display */
  verificationDocument?: VerificationDocument
  /** Optional callback to request a new verification document */
  onRequestVerificationDocument?: () => Promise<VerificationDocument | null | undefined>
  /** Dark mode toggle */
  isDarkMode?: boolean
  /** Whether to show the verification flow diagram */
  showVerificationFlow?: boolean
  /** Whether the container should fill its parent height */
  fillContainer?: boolean
}


function getStepTitle(step: 'runtime' | 'code' | 'security', status?: 'pending' | 'success' | 'failed'): string {
  const titles = {
    runtime: {
      pending: 'Enclave Attestation Verification',
      success: 'Enclave Attestation Verified',
      failed: 'Enclave Attestation Failed',
    },
    code: {
      pending: 'Source Code Verification',
      success: 'Source Code Verified',
      failed: 'Source Code Verification Failed',
    },
    security: {
      pending: 'Security Verification',
      success: 'Security Verified',
      failed: 'Security Verification Failed',
    },
  }

  return titles[step][status || 'pending']
}

export function VerificationCenter({
  verificationDocument,
  onRequestVerificationDocument,
  isDarkMode = true,
  showVerificationFlow = true,
  fillContainer = true,
}: VerificationCenterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [currentDocument, setCurrentDocument] = useState(verificationDocument)

  const secondaryButtonClasses = isDarkMode
    ? 'border-border-subtle bg-transparent text-content-secondary hover:bg-surface-card/80'
    : 'border-border-subtle bg-surface-card text-content-secondary hover:bg-surface-card/80'

  const handleRefreshClick = useCallback(async () => {
    if (!onRequestVerificationDocument) return

    setIsLoading(true)
    try {
      const result = await onRequestVerificationDocument()
      if (result) {
        setCurrentDocument(result)
      }
    } catch (error) {
      console.error('Failed to refresh verification document:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onRequestVerificationDocument])

  useEffect(() => {
    setCurrentDocument(verificationDocument)
  }, [verificationDocument])


  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const isSafariMobile = ua.includes('safari') && ua.includes('mobile')
    const isIOS = /iphone|ipad|ipod/.test(ua)
    setIsSafari((isSafariMobile || isIOS) && !ua.includes('chrome'))
  }, [])

  if (!currentDocument) {
    return (
      <div
        className={`tinfoil-verification-theme flex ${fillContainer ? 'h-full' : ''} w-full flex-col items-center justify-center bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}
        data-theme={isDarkMode ? 'dark' : 'light'}
      >
        <p className="text-sm text-content-secondary">No verification document available</p>
      </div>
    )
  }

  // Determine overall status from document
  const allSuccess =
    !isLoading &&
    currentDocument.steps.fetchDigest.status === 'success' &&
    currentDocument.steps.verifyCode.status === 'success' &&
    currentDocument.steps.verifyEnclave.status === 'success' &&
    currentDocument.steps.compareMeasurements.status === 'success'

  const hasError =
    !isLoading &&
    (currentDocument.steps.fetchDigest.status === 'failed' ||
    currentDocument.steps.verifyCode.status === 'failed' ||
    currentDocument.steps.verifyEnclave.status === 'failed' ||
    currentDocument.steps.compareMeasurements.status === 'failed')

  const summaryStatus = isLoading ? 'progress' : hasError ? 'error' : allSuccess ? 'success' : 'progress'
  const summaryMessage = isLoading
    ? 'Running enclave verification...'
    : hasError
    ? 'Enclave verification failed'
    : allSuccess
    ? 'Enclave verification passed'
    : 'Enclave verification in progress'

  const flowStatus = isLoading ? 'verifying' : hasError ? 'error' : allSuccess ? 'success' : 'verifying'

  // When loading, show pending status for all steps
  const getStepStatus = (stepStatus: 'pending' | 'success' | 'failed'): 'pending' | 'success' | 'error' => {
    if (isLoading) return 'pending'
    return stepStatus === 'failed' ? 'error' : stepStatus
  }

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
          summary={{ status: summaryStatus, message: summaryMessage }}
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
                onClick={handleRefreshClick}
                disabled={isLoading || !onRequestVerificationDocument}
                className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${secondaryButtonClasses}`}
                style={{ minWidth: '140px', maxWidth: '180px' }}
              >
                {isLoading ? (
                  <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                ) : (
                  <LuRefreshCcwDot className="h-4 w-4" />
                )}
                {isLoading ? 'Verifying...' : 'Verify Again'}
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
            title={isLoading ? getStepTitle('runtime', 'pending') : getStepTitle('runtime', currentDocument.steps.verifyEnclave.status)}
            description="Verifies the secure hardware environment. The response consists of a signed measurement by a combination of NVIDIA, AMD, and Intel certifying the enclave environment and the digest of the binary (i.e., code) actively running inside it."
            status={getStepStatus(currentDocument.steps.verifyEnclave.status)}
            error={isLoading ? undefined : currentDocument.steps.verifyEnclave.error}
            measurement={JSON.stringify(currentDocument.enclaveMeasurement.measurement)}
            digestType="RUNTIME"
            isDarkMode={isDarkMode}
          />

          <ProcessStep
            title={isLoading ? getStepTitle('code', 'pending') : getStepTitle('code', currentDocument.steps.verifyCode.status)}
            description="Verifies that the source code published publicly by Tinfoil on GitHub was correctly built through GitHub Actions and that the resulting binary is available on the Sigstore transparency log."
            status={getStepStatus(currentDocument.steps.verifyCode.status)}
            error={isLoading ? undefined : currentDocument.steps.verifyCode.error}
            measurement={JSON.stringify(currentDocument.codeMeasurement)}
            digestType="SOURCE"
            verificationDocument={currentDocument}
            githubHash={currentDocument.releaseDigest}
            isDarkMode={isDarkMode}
          />

          <ProcessStep
            title={isLoading ? getStepTitle('security', 'pending') : getStepTitle('security', currentDocument.steps.compareMeasurements.status)}
            description="Verifies that the binary built from the source code matches the binary running in the secure enclave by comparing digests from the enclave and the committed digest from the transparency log."
            status={getStepStatus(currentDocument.steps.compareMeasurements.status)}
            error={isLoading ? undefined : currentDocument.steps.compareMeasurements.error}
            digestType="CODE_INTEGRITY"
            isDarkMode={isDarkMode}
          >
            <MeasurementDiff
              sourceMeasurements={JSON.stringify(currentDocument.codeMeasurement)}
              runtimeMeasurements={JSON.stringify(currentDocument.enclaveMeasurement.measurement)}
              isVerified={currentDocument.securityVerified}
              isDarkMode={isDarkMode}
              showStatusBanner={currentDocument.securityVerified}
            />
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
