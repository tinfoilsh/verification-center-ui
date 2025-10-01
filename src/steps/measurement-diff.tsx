import { LuCheck, LuTriangleAlert } from 'react-icons/lu'

interface MeasurementData {
  measurement?: string
  certificate?: string
}

type MeasurementDiffProps = {
  sourceMeasurements: MeasurementData | string
  runtimeMeasurements: MeasurementData | string
  isVerified: boolean
  isDarkMode?: boolean
}

// Utility function to extract measurement value
const extractMeasurement = (data: MeasurementData | string): string => {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data.replace(/^"|"$/g, ''))
      if (
        parsed.registers &&
        Array.isArray(parsed.registers) &&
        parsed.registers.length > 0
      ) {
        return String(parsed.registers[0])
      }
    } catch {
      // Fall through to return raw data
    }
    return data.replace(/^"|"$/g, '')
  }
  if (typeof data === 'object' && data?.measurement) {
    try {
      const parsed = JSON.parse(data.measurement)
      if (
        parsed.registers &&
        Array.isArray(parsed.registers) &&
        parsed.registers.length > 0
      ) {
        return String(parsed.registers[0])
      }
    } catch {
      // Fall through to return raw measurement
    }
    return data.measurement
  }
  return JSON.stringify(data, null, 2).replace(/"/g, '')
}

export function MeasurementDiff({
  sourceMeasurements,
  runtimeMeasurements,
  isVerified,
  isDarkMode = true,
}: MeasurementDiffProps) {
  return (
    <div>
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

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium text-content-primary">
            Source Measurement
            <span
              className="block text-xs font-normal text-content-secondary"
            >
              Received from GitHub and Sigstore.
            </span>
          </h4>
          <div className="max-h-[200px] overflow-auto">
            <pre
              className={`overflow-x-auto whitespace-pre-wrap break-all rounded-lg border p-3 text-sm transition-colors ${
                isDarkMode
                  ? 'border-border-subtle bg-surface-chat text-content-primary'
                  : 'border-border-subtle bg-surface-card text-content-primary'
              } ${isVerified ? 'border-emerald-500/50' : 'border-red-400/50'}`}
            >
              {extractMeasurement(sourceMeasurements)}
            </pre>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-content-primary">
            Runtime Measurement
            <span
              className="block text-xs font-normal text-content-secondary"
            >
              Received from the enclave.
            </span>
          </h4>
          <div className="max-h-[200px] overflow-auto">
            <pre
              className={`overflow-x-auto whitespace-pre-wrap break-all rounded-lg border p-3 text-sm transition-colors ${
                isDarkMode
                  ? 'border-border-subtle bg-surface-chat text-content-primary'
                  : 'border-border-subtle bg-surface-card text-content-primary'
              } ${isVerified ? 'border-emerald-500/50' : 'border-red-400/50'}`}
            >
              {extractMeasurement(runtimeMeasurements)}
            </pre>
          </div>
        </div>

      </div>
    </div>
  )
}
