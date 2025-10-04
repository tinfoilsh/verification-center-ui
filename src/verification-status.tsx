import { LuTriangleAlert } from 'react-icons/lu'

// Vendor marks for attestation providers displayed on success
import { amdIcon, intelIcon, nvidiaIcon } from './assets/base64'
import type { VerificationSummaryStatus } from './types/verification'

type VerificationStatusProps = {
  summary: {
    status: VerificationSummaryStatus
    message?: string
  }
  isDarkMode?: boolean
}

/**
 * VerificationStatus
 * Single-container banner that smoothly transitions colors between states.
 */
function VerificationStatus({ summary, isDarkMode = true }: VerificationStatusProps) {
  const status = summary.status
  const message = summary.message

  const containerColors =
    status === 'error'
      ? isDarkMode
        ? 'bg-red-500/10 text-red-400'
        : 'bg-red-50 text-red-600'
      : status === 'success'
        ? isDarkMode
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-emerald-50 text-emerald-600'
        : isDarkMode
          ? 'bg-gray-800/50 text-gray-300'
          : 'bg-gray-100 text-gray-700'

  const resolvedStatus: VerificationSummaryStatus = status
  const resolvedMessage =
    message ||
    (resolvedStatus === 'error'
      ? 'Verification failed. Please check the errors.'
      : resolvedStatus === 'success'
        ? 'This AI is running inside a secure enclave.'
        : 'Verification in progress. This process ensures your data remains secure and private by confirming code integrity and runtime environment isolation.')

  return (
    <div
      className={`mt-0 flex min-h-16 items-center gap-2 p-3 transition-colors duration-300 ${containerColors}`}
    >
      {resolvedStatus === 'error' && (
        <>
          <LuTriangleAlert className="h-5 w-5 flex-shrink-0" />
          <p className="overflow-hidden break-words break-all text-sm">
            {resolvedMessage}
          </p>
        </>
      )}

      {resolvedStatus === 'success' && (
        <div className="flex flex-col gap-1">
          <p className="text-sm">{resolvedMessage}</p>
          <div
            className={`flex items-center gap-2 opacity-70 ${
              isDarkMode ? 'text-white' : 'text-gray-700'
            }`}
          >
            <span className="text-xs">Attested by</span>
            <img
              src={nvidiaIcon}
              alt="NVIDIA"
              width={40}
              height={15}
              className={`${!isDarkMode ? 'invert' : ''} pt-0.5`}
            />
            <span className="text-sm">·</span>
            <img
              src={amdIcon}
              alt="AMD"
              width={25}
              height={15}
              className={`${isDarkMode ? 'invert' : ''} pt-0.5`}
            />
            <span className="text-sm">·</span>
            <img
              src={intelIcon}
              alt="Intel"
              width={20}
              height={10}
              className={`${isDarkMode ? 'invert' : ''}`}
            />
          </div>
        </div>
      )}

      {resolvedStatus === 'progress' && (
        <p className="break-words text-sm">{resolvedMessage}</p>
      )}
    </div>
  )
}

export default VerificationStatus
