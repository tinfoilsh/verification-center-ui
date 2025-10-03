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

export interface VerificationDocument {
  configRepo: string
  enclaveHost: string
  releaseDigest: string
  codeMeasurement: AttestationMeasurement
  enclaveMeasurement: AttestationResponse
  match: boolean
}

