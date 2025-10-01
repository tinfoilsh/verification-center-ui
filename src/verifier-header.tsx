import { LuX } from 'react-icons/lu'
import logoGreen from './assets/logo-green.svg'
import logoWhite from './assets/logo-white.svg'

type VerifierHeaderProps = {
  isDarkMode?: boolean
  onClose: () => void
  className?: string
}

/**
 * VerifierHeader - Shared header component for the Verification Center
 *
 * Displays the Tinfoil logo on the left, "Verification Center" title centered,
 * and close button on the right. Used in both VerifierSidebar and VerifierModal.
 */
export function VerifierHeader({
  isDarkMode = true,
  onClose,
  className = '',
}: VerifierHeaderProps) {
  return (
    <div
      className={`relative flex h-16 items-center justify-between px-4 ${
        isDarkMode
          ? 'border-border-subtle bg-gray-900'
          : 'border-gray-200 bg-white'
      } ${className}`}
      style={{ minHeight: '64px' }}
    >
      <div className="flex items-center">
        <img
          src={isDarkMode ? logoWhite : logoGreen}
          alt="Tinfoil"
          width={70}
          height={30}
          className={isDarkMode ? '' : 'opacity-80'}
        />
      </div>
      <span
        className={`text-md absolute left-1/2 -translate-x-1/2 font-semibold ${
          isDarkMode ? 'text-white' : 'text-content-primary'
        }`}
        style={{ fontFamily: 'inherit' }}
      >
        Verification Center
      </span>
      <button
        className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
          isDarkMode
            ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onClick={onClose}
      >
        <LuX className="h-5 w-5" />
      </button>
    </div>
  )
}
