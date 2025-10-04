/**
 * Attestation measurement containing type and register values
 */
export interface AttestationMeasurement {
  type: string
  registers: string[]
}

/**
 * Attestation response from the enclave
 */
export interface AttestationResponse {
  measurement: AttestationMeasurement
  tlsPublicKeyFingerprint?: string
  hpkePublicKey?: string
}

/**
 * State of an intermediate verification step
 */
export interface VerificationStepState {
  status: 'pending' | 'success' | 'failed'
  error?: string
}

/**
 * Overall verification summary status for the banner
 */
export type VerificationSummaryStatus = 'error' | 'success' | 'progress'

/**
 * Verification flow status for the flow diagram
 */
export type VerificationFlowStatus = 'idle' | 'verifying' | 'success' | 'error'

/**
 * Complete verification document containing all necessary data for the UI.
 * This is the primary interface between the verification backend and the UI component.
 */
export interface VerificationDocument {
  /** GitHub repository path (e.g., "owner/repo") for source code links */
  configRepo: string
  /** Host address of the enclave being verified */
  enclaveHost: string
  /** Release digest hash for Sigstore verification links */
  releaseDigest: string
  /** Code measurement from GitHub and Sigstore */
  codeMeasurement: AttestationMeasurement
  /** Enclave measurement and attestation data */
  enclaveMeasurement: AttestationResponse
  /** Whether measurements match (security verification passed) */
  securityVerified: boolean
  /** Individual verification step states */
  steps: {
    fetchDigest: VerificationStepState
    verifyCode: VerificationStepState
    verifyEnclave: VerificationStepState
    compareMeasurements: VerificationStepState
  }
}
