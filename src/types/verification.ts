/**
 * Shared attestation document types used by the verification UI.
 * These should match the `tinfoil` package and are defined locally so
 * the UI can operate independently of that runtime.
 */
export interface AttestationMeasurement {
  type: string
  registers: string[]
}

export interface AttestationResponse {
  measurement: AttestationMeasurement
  tlsPublicKeyFingerprint?: string
  hpkePublicKey?: string
}

export type VerificationStepStatus =
  | 'pending'
  | 'loading'
  | 'success'
  | 'error'

export type VerificationFlowStatus =
  | 'idle'
  | 'verifying'
  | 'success'
  | 'error'

export type VerificationSummaryStatus = 'error' | 'success' | 'progress'

export type VerificationMeasurementDisplay =
  | string
  | {
      measurement: string
      certificate?: string
    }

export interface VerificationStepDisplay {
  status: VerificationStepStatus
  error?: string
  measurement?: VerificationMeasurementDisplay
  technicalDetails?: string
}

export interface VerificationComparisonDisplay {
  isVerified: boolean
  sourceMeasurements?: VerificationMeasurementDisplay
  runtimeMeasurements?: VerificationMeasurementDisplay
}

export interface VerificationUiState {
  summary: {
    status: VerificationSummaryStatus
    message?: string
  }
  flowStatus: VerificationFlowStatus
  steps: {
    runtime: VerificationStepDisplay & {
      attestation?: AttestationResponse
    }
    code: VerificationStepDisplay & {
      githubHash?: string
      sourceMeasurement?: AttestationMeasurement
    }
    security: VerificationStepDisplay & {
      comparison?: VerificationComparisonDisplay
    }
  }
}

export interface VerificationDocument {
  configRepo?: string
  enclaveHost?: string
  releaseDigest?: string
  ui: VerificationUiState
  /**
   * Optional raw payload for consumers that need the original attestation data.
   * The VerificationCenter component does not interpret this value.
   */
  rawPayload?: unknown
}
