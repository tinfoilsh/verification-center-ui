import { useEffect, useRef, useState } from 'react'
import { CONSTANTS } from './constants'
import { VerificationCenter } from './verifier'
import type { VerificationCenterProps } from './verifier'
import type { VerificationDocument } from './types/verification'
import { VerifierHeader } from './verifier-header'

type VerifierSidebarProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isDarkMode?: boolean
  /** Width of the sidebar in pixels. Defaults to CONSTANTS.VERIFIER_SIDEBAR_WIDTH_PX */
  width?: number
  /** Whether to display the verification flow diagram. Defaults to true */
  showVerificationFlow?: boolean
  /** Optional precomputed verification document from client */
  verificationDocument?: VerificationDocument
  /** Optional callback for requesting a fresh verification document */
  onRequestVerificationDocument?:
    VerificationCenterProps['onRequestVerificationDocument']
}

export function VerifierSidebar({
  isOpen,
  setIsOpen,
  isDarkMode = true,
  width = CONSTANTS.VERIFIER_SIDEBAR_WIDTH_PX,
  showVerificationFlow = true,
  verificationDocument,
  onRequestVerificationDocument,
}: VerifierSidebarProps) {
  const verifierKey = useRef<number>(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      {/* Right Sidebar wrapper */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } tinfoil-verification-theme fixed right-0 z-[9999] flex h-dvh w-[85vw] flex-col overflow-hidden border-l transition-all duration-200 ease-in-out ${
          isDarkMode
            ? 'dark border-border-subtle bg-surface-card text-content-primary'
            : 'border-gray-200 bg-white text-gray-900'
        }`}
        data-theme={isDarkMode ? 'dark' : 'light'}
        style={{ maxWidth: `${width}px`, fontFamily: 'inherit' }}
      >
        <VerifierHeader
          isDarkMode={isDarkMode}
          onClose={() => setIsOpen(false)}
          className="flex-none"
        />

        {/* Verification Engine content */}
        <div className="flex-1 overflow-y-auto">
          {isClient && (
            <VerificationCenter
              key={verifierKey.current}
              isDarkMode={isDarkMode}
              showVerificationFlow={showVerificationFlow}
              verificationDocument={verificationDocument}
              onRequestVerificationDocument={onRequestVerificationDocument}
            />
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
