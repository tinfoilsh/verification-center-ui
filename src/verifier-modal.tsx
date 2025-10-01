import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { VerificationCenter } from './verifier'
import { VerifierHeader } from './verifier-header'

type VerifierModalProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isDarkMode?: boolean
  /** Whether to display the verification flow diagram. Defaults to true */
  showVerificationFlow?: boolean
  /** Optional precomputed verification document from client */
  verificationDocument?: import('tinfoil').VerificationDocument
}

/**
 * VerifierModal - A modal wrapper for the Verification Center component
 *
 * This component provides a centered modal interface for the verification system,
 * as an alternative to the sidebar layout.
 */
export function VerifierModal({
  isOpen,
  setIsOpen,
  isDarkMode = true,
  showVerificationFlow = true,
  verificationDocument,
}: VerifierModalProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`tinfoil-verification-theme relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl ${
                  isDarkMode ? 'dark bg-gray-900' : 'bg-white'
                }`}
                data-theme={isDarkMode ? 'dark' : 'light'}
              >
                <VerifierHeader
                  isDarkMode={isDarkMode}
                  onClose={() => setIsOpen(false)}
                  className="px-6"
                />

                {/* Content */}
                <div className="max-h-[80vh] overflow-y-auto">
                  {isClient && (
                    <VerificationCenter
                      isDarkMode={isDarkMode}
                      showVerificationFlow={showVerificationFlow}
                      verificationDocument={verificationDocument}
                    />
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
