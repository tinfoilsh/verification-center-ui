import { LuChevronDown, LuTriangleAlert } from 'react-icons/lu'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { IoCodeSlashOutline } from 'react-icons/io5'
import { StatusIcon } from './status-icon'

// Brand assets used in the step details
import type { VerificationDocument } from 'tinfoil'
import {
  amdIcon,
  cpuIcon,
  githubIcon,
  gpuIcon,
  intelIcon,
  nvidiaIcon,
  sigstoreIcon,
  sigstoreLightIcon,
} from '../assets/base64'

type DigestType = 'SOURCE' | 'RUNTIME' | 'CODE_INTEGRITY' | 'GENERIC'

interface MeasurementData {
  measurement?: string
  certificate?: string
}

/**
 * Extract a compact, human-readable measurement value from various inputs.
 * Accepts raw strings or objects with a `measurement` JSON payload.
 */
const extractMeasurement = (data: MeasurementData | string): string => {
  if (typeof data === 'string') {
    // Check if it's a JSON string that needs parsing
    try {
      const parsed = JSON.parse(data.replace(/^"|"$/g, ''))
      if (
        parsed.registers &&
        Array.isArray(parsed.registers) &&
        parsed.registers.length > 0
      ) {
        return parsed.registers[0]
      }
    } catch {
      // Not JSON, return as is
    }
    return data.replace(/^"|"$/g, '')
  }
  if (typeof data === 'object' && data?.measurement) {
    // Check if measurement contains JSON
    try {
      const parsed = JSON.parse(data.measurement)
      if (
        parsed.registers &&
        Array.isArray(parsed.registers) &&
        parsed.registers.length > 0
      ) {
        return parsed.registers[0]
      }
    } catch {
      // Not JSON, return as is
    }
    return data.measurement
  }
  return JSON.stringify(data, null, 2)
}

/**
 * Map a digestType into a title and subtitle for the measurement block.
 * Keeps presentation strings co-located and reduces inline branching.
 */
function getMeasurementLabel(digestType?: DigestType): {
  title: string
  subtitle?: string
} {
  switch (digestType) {
    case 'SOURCE':
      return {
        title: 'Source Measurement',
        subtitle: 'Received from GitHub and Sigstore.',
      }
    case 'RUNTIME':
      return {
        title: 'Runtime Measurement',
        subtitle: 'Received from the enclave.',
      }
    case 'CODE_INTEGRITY':
      return {
        title: 'Security Verification',
        subtitle: 'Comparison of source and runtime measurements.',
      }
    default:
      return { title: 'Measurement' }
  }
}

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.05, staggerChildren: 0.06 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
} as const

type ProcessStepProps = {
  title: string
  description: string
  status: 'pending' | 'loading' | 'success' | 'error'
  error?: string
  measurements?: MeasurementData | string
  technicalDetails?: string
  children?: ReactNode
  digestType?: DigestType
  githubHash?: string
  verificationDocument?: VerificationDocument
  isDarkMode?: boolean
}

export function ProcessStep({
  title,
  description,
  status,
  error,
  measurements,
  technicalDetails,
  children,
  digestType,
  githubHash,
  verificationDocument,
  isDarkMode = true,
}: ProcessStepProps) {
  const [isOpen, setIsOpen] = useState(
    status === 'error' || error !== undefined,
  )

  useEffect(() => {
    if (status === 'error' || error !== undefined) {
      setIsOpen(true)
    }
  }, [status, error])

  // Feature flags for auxiliary UI derived strictly from digestType
  const isRemoteAttestation = digestType === 'RUNTIME'
  const isSourceCodeVerified = digestType === 'SOURCE'

  const label = getMeasurementLabel(digestType)

  const repoForLink = verificationDocument?.configRepo
  const hashForSigstore = verificationDocument?.releaseDigest ?? githubHash

  return (
    <div
      className={`w-full rounded-lg border transition-colors @container shadow-sm ${
        isDarkMode
          ? 'border-border-subtle bg-surface-card/80'
          : 'border-border-subtle bg-surface-card'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 text-left"
      >
        <div className="flex flex-row items-center gap-3 md:gap-4">
          <div className="flex items-center">
            <StatusIcon status={status} />
          </div>

          <div className="flex-1 text-center @[400px]:text-left">
            <h3 className="text-sm font-medium text-content-primary">
              {title}
            </h3>
            <p
              className={`hidden text-sm text-content-secondary @[400px]:block`}
            >
              {description}
            </p>
          </div>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`rounded-lg p-2 transition-colors ${
              isDarkMode ? 'hover:bg-surface-card/70' : 'hover:bg-surface-card/80'
            }`}
          >
            <LuChevronDown className="h-5 w-5 text-content-muted" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="process-step-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.25, 0.8, 0.25, 1] },
              opacity: { duration: 0.2, ease: 'easeOut' },
            }}
            className="overflow-hidden"
          >
            <motion.div
              className="space-y-4 px-4 pb-4"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.p
                variants={itemVariants}
                className={`block text-sm text-content-secondary @[400px]:hidden`}
              >
                {description}
              </motion.p>

              {error && status === 'error' && (
                <motion.div
                  variants={itemVariants}
                  className={`flex items-start gap-2 rounded-lg p-3 transition-colors ${
                    isDarkMode
                      ? 'bg-red-500/10 text-red-300'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  <LuTriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="overflow-hidden break-words text-sm">{error}</p>
                </motion.div>
              )}

              {measurements && (
                <motion.div variants={itemVariants}>
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="text-sm font-medium text-content-primary">
                      {label.title}
                      {label.subtitle && (
                        <span
                          className="block text-xs font-normal text-content-secondary"
                        >
                          {label.subtitle}
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2">
                      {digestType === 'SOURCE' ? (
                        <IoCodeSlashOutline
                          className="text-content-muted"
                          size={20}
                        />
                      ) : digestType === 'RUNTIME' ? (
                        <>
                          <img
                            src={cpuIcon}
                            alt="CPU"
                            width={15}
                            height={15}
                            className={`${isDarkMode ? 'invert' : ''} opacity-70`}
                          />
                          <span
                            className="text-sm text-content-muted"
                          >
                            +
                          </span>
                          <img
                            src={gpuIcon}
                            alt="GPU"
                            width={26}
                            height={13}
                            className={`${isDarkMode ? 'invert' : ''} opacity-70`}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                  <pre
                    className={`overflow-x-auto whitespace-pre-wrap break-all rounded-lg border p-4 text-sm transition-colors ${
                      isDarkMode
                        ? 'border-border-subtle bg-surface-chat text-content-primary'
                        : 'border-border-subtle bg-surface-card text-content-primary'
                    } ${status === 'success' ? 'border-emerald-500/50' : ''}`}
                  >
                    {extractMeasurement(measurements)}
                  </pre>
                </motion.div>
              )}

              {isRemoteAttestation && (
                <motion.div variants={itemVariants} className="mt-3">
                  <h4 className="mb-2 text-sm font-medium text-content-primary">
                    Runtime attested by
                  </h4>
                  <div className="mt-2 flex items-center space-x-2">
                    <a
                      href="https://docs.nvidia.com/attestation/index.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-10 w-20 items-center justify-center rounded-lg p-2 transition-colors ${
                        isDarkMode
                          ? 'border border-gray-600 bg-surface-card/70 hover:bg-surface-card/50 hover:border-gray-500'
                          : 'border border-gray-300 bg-surface-card/70 hover:bg-surface-card/50 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={nvidiaIcon}
                        alt="NVIDIA"
                        width={60}
                        height={18}
                        className={`max-h-4 w-auto opacity-60 ${!isDarkMode ? 'invert' : ''}`}
                      />
                    </a>
                    <a
                      href="https://www.amd.com/en/developer/sev.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-10 w-20 items-center justify-center rounded-lg p-2 transition-colors ${
                        isDarkMode
                          ? 'border border-gray-600 bg-surface-card/70 hover:bg-surface-card/50 hover:border-gray-500'
                          : 'border border-gray-300 bg-surface-card/70 hover:bg-surface-card/50 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={amdIcon}
                        alt="AMD"
                        width={40}
                        height={30}
                        className={`max-h-2.5 w-auto opacity-60 ${isDarkMode ? 'invert' : ''}`}
                      />
                    </a>
                    <a
                      href="https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/overview.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-10 w-20 items-center justify-center rounded-lg p-2 transition-colors ${
                        isDarkMode
                          ? 'border border-gray-600 bg-surface-card/70 hover:bg-surface-card/50 hover:border-gray-500'
                          : 'border border-gray-300 bg-surface-card/70 hover:bg-surface-card/50 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={intelIcon}
                        alt="Intel"
                        width={36}
                        height={18}
                        className={`max-h-3 w-auto opacity-60 ${isDarkMode ? 'invert' : ''}`}
                      />
                    </a>
                  </div>
                </motion.div>
              )}

              {isSourceCodeVerified && (
                <motion.div variants={itemVariants} className="mt-3">
                  <h4 className="mb-2 text-sm font-medium text-content-primary">
                    Code integrity attested by
                  </h4>
                  <div className="mt-2 flex items-center space-x-4">
                    {repoForLink && (
                      <a
                        href={`https://github.com/${repoForLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-content-secondary transition-colors hover:text-content-primary"
                      >
                        <div className="flex items-center">
                          <img
                            src={githubIcon}
                            alt="GitHub"
                            width={20}
                            height={20}
                            className={`h-5 w-auto ${isDarkMode ? 'invert' : ''}`}
                          />
                        </div>
                        <span>GitHub</span>
                      </a>
                    )}
                    {hashForSigstore && (
                      <a
                        href={`https://search.sigstore.dev/?hash=${hashForSigstore}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-content-secondary transition-colors hover:text-content-primary"
                      >
                        <div className="flex items-center">
                          <img
                            src={isDarkMode ? sigstoreIcon : sigstoreLightIcon}
                            alt="Sigstore"
                            width={20}
                            height={20}
                            className="h-5 w-auto"
                          />
                        </div>
                        <span>Sigstore</span>
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {children && (
                <motion.div variants={itemVariants}>{children}</motion.div>
              )}

              {technicalDetails && (
                <motion.div variants={itemVariants}>
                  <h4 className="mb-2 text-sm font-medium text-content-primary">
                    Technical Details
                  </h4>
                  <p
                    className="text-sm text-content-secondary"
                  >
                    {technicalDetails}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
