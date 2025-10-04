import { LuCheck, LuTriangleAlert } from 'react-icons/lu'
import { parseMeasurement, type MeasurementData } from '../utils/measurement'

type MeasurementDiffProps = {
  sourceMeasurements: MeasurementData | string
  runtimeMeasurements: MeasurementData | string
  isVerified: boolean
  isDarkMode?: boolean
  showStatusBanner?: boolean
}

export function MeasurementDiff({
  sourceMeasurements,
  runtimeMeasurements,
  isVerified,
  isDarkMode = true,
  showStatusBanner = true,
}: MeasurementDiffProps) {
  const parsedSource = parseMeasurement(sourceMeasurements)
  const parsedRuntime = parseMeasurement(runtimeMeasurements)

  return (
    <div>
      {showStatusBanner && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 transition-colors ${
            isVerified
              ? isDarkMode
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-emerald-50 text-emerald-600'
              : isDarkMode
                ? 'bg-red-500/10 text-red-300'
                : 'bg-red-50 text-red-600'
          }`}
        >
          {isVerified ? (
            <LuCheck className="h-5 w-5" />
          ) : (
            <LuTriangleAlert className="h-5 w-5" />
          )}
          <span className="text-sm">
            {isVerified ? 'Measurements Match' : 'Measurement mismatch detected'}
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-content-primary">
              Source Measurement
              <span className="block text-xs font-normal text-content-secondary">
                Received from GitHub and Sigstore.
              </span>
            </h4>
            {parsedSource && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                isDarkMode
                  ? 'bg-gray-700/50 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {parsedSource.type}
              </span>
            )}
          </div>
          <div className="max-h-[200px] overflow-auto">
            {parsedSource && (
              <div className="space-y-2">
                {parsedSource.registers.map((register, i) => (
                  <div
                    key={i}
                    className={`overflow-x-auto rounded-lg border p-3 transition-colors ${
                      isDarkMode
                        ? 'border-border-subtle bg-surface-chat text-content-primary'
                        : 'border-border-subtle bg-surface-card text-content-primary'
                    } ${isVerified ? 'border-emerald-500/50' : 'border-red-400/50'}`}
                  >
                    <div className="break-all font-mono text-sm">
                      {register}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium text-content-primary">
              Runtime Measurement
              <span className="block text-xs font-normal text-content-secondary">
                Received from the enclave.
              </span>
            </h4>
            {parsedRuntime && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                isDarkMode
                  ? 'bg-gray-700/50 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {parsedRuntime.type}
              </span>
            )}
          </div>
          <div className="max-h-[200px] overflow-auto">
            {parsedRuntime && (
              <div className="space-y-2">
                {parsedRuntime.registers.map((register, i) => (
                  <div
                    key={i}
                    className={`overflow-x-auto rounded-lg border p-3 transition-colors ${
                      isDarkMode
                        ? 'border-border-subtle bg-surface-chat text-content-primary'
                        : 'border-border-subtle bg-surface-card text-content-primary'
                    } ${isVerified ? 'border-emerald-500/50' : 'border-red-400/50'}`}
                  >
                    <div className="break-all font-mono text-sm">
                      {register}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
