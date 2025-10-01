import type { VerificationDocument } from 'tinfoil/verifier'

const baseDocument: VerificationDocument = {
  configRepo: 'tinfoilsh/example-configs',
  enclaveHost: 'https://demo.enclave.tinfoil.sh',
  releaseDigest:
    'sha256:74e1b91b4867d4b0fc3a1e9bc82a999aa1dd96c7fa968eefc8c9a7bd403f2f00',
  codeMeasurement: {
    type: 'sev-snp',
    registers: [
      '886a7e94bbf06e25550cbd2f29d78ad441e205fe84c60c383ffddcb814a81898',
      '51d6595417a6de571d25fe1b6aa7cb334cbeff8a64d620dbc62efdc34f3d06a3',
      '18c9246b5bf5056f4b9b8c5b8e7dca83958e8759a8b22eed7320bcbaa5b8d79c',
    ],
  },
  enclaveMeasurement: {
    tlsPublicKeyFingerprint:
      'sha256:4dcec7f452e67341f72c7414973ab0c0f4649fa748ba1fd0fda92b3ad2562e8c',
    measurement: {
      type: 'sev-snp',
      registers: [
        '886a7e94bbf06e25550cbd2f29d78ad441e205fe84c60c383ffddcb814a81898',
        '51d6595417a6de571d25fe1b6aa7cb334cbeff8a64d620dbc62efdc34f3d06a3',
        '18c9246b5bf5056f4b9b8c5b8e7dca83958e8759a8b22eed7320bcbaa5b8d79c',
      ],
    },
  },
  match: true,
}

export const mockSuccessDocument: VerificationDocument = baseDocument

export const mockFailureDocument: VerificationDocument = {
  ...baseDocument,
  match: false,
  enclaveMeasurement: {
    ...baseDocument.enclaveMeasurement,
    measurement: {
      ...baseDocument.enclaveMeasurement.measurement,
      registers: [
        '1111111111111111111111111111111111111111111111111111111111111111',
        ...baseDocument.enclaveMeasurement.measurement.registers.slice(1),
      ],
    },
  },
}
