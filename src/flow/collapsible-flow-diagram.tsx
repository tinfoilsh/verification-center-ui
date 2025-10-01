'use client'

import { LuChevronDown } from 'react-icons/lu'
import React, { useId, useState } from 'react'
import { BsDiagram3 } from 'react-icons/bs'

type CollapsibleFlowDiagramProps = {
  children: React.ReactNode
  isDarkMode?: boolean
}

export function CollapsibleFlowDiagram({
  children,
  isDarkMode = true,
}: CollapsibleFlowDiagramProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false)
  const isExpanded = internalIsExpanded
  const contentId = useId()

  return (
    <div
      className={`w-full rounded-lg border @container shadow-sm transition-colors ${
        isDarkMode
          ? 'border-border-subtle bg-surface-card/80'
          : 'border-border-subtle bg-surface-card'
      }`}
    >
      <button
        type="button"
        onClick={() => setInternalIsExpanded(!internalIsExpanded)}
        className="w-full p-4 text-left"
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="flex flex-row items-center gap-3 md:gap-4">
          <div className="flex items-center">
            <BsDiagram3
              className={`h-6 w-6 ${
                isDarkMode ? 'text-content-primary' : 'text-content-secondary'
              }`}
            />
          </div>

          <div className="flex-1 text-center @[400px]:text-left">
            <h3
              className={`text-sm font-medium text-content-primary`}
            >
              Verification Flow Diagram
            </h3>
            <p
              className={`hidden text-sm text-content-secondary @[400px]:block`}
            >
              Visual representation of the verification process and data flow
            </p>
          </div>

          <div
            className={`rounded-lg p-2 transition-colors ${
              isDarkMode ? 'hover:bg-surface-card/70' : 'hover:bg-surface-card/80'
            }`}
          >
            <LuChevronDown
              className={`h-5 w-5 text-content-muted transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </button>

      <div
        id={contentId}
        className={`border-border-subtle ${
          isExpanded ? 'border-t' : 'border-t-0'
        } overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="rounded-b-lg bg-surface-card px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
