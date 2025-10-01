# Tinfoil Verification Center UI

React components that render the Tinfoil verification center experience. Pair it with the `tinfoil` SDK to embed trust signals for confidential inference directly inside your product UI.

## Installation

```bash
npm install tinfoil @tinfoilsh/verification-center-ui
```

Install the peer dependencies your host app must provide:

```bash
npm install react react-dom @xyflow/react react-icons framer-motion @headlessui/react tinfoil
```

> **Requirements:** The UI expects React 18 or newer and a bundler that can import CSS files from npm packages (Vite, Next.js, Create React App, etc.). `tinfoil` version `0.8.1` or later must be available at runtime, because the verifier calls into that SDK.

## Usage

The component talks to the `tinfoil` SDK in the browser. Mount it anywhere you want to surface verification status.

```tsx
import { VerificationCenter } from '@tinfoilsh/verification-center-ui'

export function VerificationPage({
  document,
  theme = 'dark',
  showFlow = true,
}) {
  return (
    <VerificationCenter
      isDarkMode={theme === 'dark'}
      showVerificationFlow={showFlow}
      verificationDocument={document}
    />
  )
}
```

When no `verificationDocument` prop is supplied the component will call `loadVerifier()` from the `tinfoil` package when the client is initialized successfully. 

### Props

`VerificationCenter` exposes a small set of props so you can integrate it with the rest of your UI:

- `isDarkMode?: boolean` – toggles the dark theme (defaults to `true`).
- `showVerificationFlow?: boolean` – hides the network diagram when `false` (defaults to `true`).
- `verificationDocument?: VerificationDocument` – supply a precomputed verification document to skip running the verifier in the browser.

### Layout wrappers

If you want an opinionated container, the package ships with both a sidebar drawer and a centered modal built around `VerificationCenter`:

- `VerifierSidebar` slides in from the right edge of the screen. It requires `isOpen`/`setIsOpen` state, plus the same optional props you pass to `VerificationCenter` (`isDarkMode`, `showVerificationFlow`, `verificationDocument`).
- `VerifierModal` renders the content inside a Headless UI `Dialog`. Provide `isOpen`/`setIsOpen`, and optionally forward the verification props.

```tsx
import { useState } from 'react'
import {
  VerificationCenter,
  VerifierSidebar,
  VerifierModal,
} from '@tinfoilsh/verification-center-ui'
import type { VerificationDocument } from 'tinfoil/verifier'

export function VerificationEntryPoints({ document }: { document?: VerificationDocument }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button onClick={() => setSidebarOpen(true)}>Open Sidebar</button>
      <button onClick={() => setModalOpen(true)}>Open Modal</button>

      <VerifierSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        verificationDocument={document}
      />

      <VerifierModal
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        verificationDocument={document}
      />

      {/* You can also mount the bare component inline */}
      <VerificationCenter verificationDocument={document} />
    </>
  )
}
```

### Using the result from `TinfoilAI`

If you already bootstrap a `TinfoilAI` client you can reuse its verification document instead of triggering another attestation pass. This is useful when you want to show the UI alongside an inference experience that already authenticated against Tinfoil.

```tsx
import { useEffect, useState } from 'react'
import { VerificationCenter } from '@tinfoilsh/verification-center-ui'
import { TinfoilAI } from 'tinfoil'
import type { VerificationDocument } from 'tinfoil/verifier'

export function VerifiedChat() {
  const [verificationDocument, setVerificationDocument] = useState<VerificationDocument>()

  useEffect(() => {
    const client = new TinfoilAI({
      apiKey: process.env.NEXT_PUBLIC_TINFOIL_API_KEY,
      baseURL: process.env.NEXT_PUBLIC_TINFOIL_BASE_URL,
    })

    client
      .ready()
      .then(() => client.getVerificationDocument())
      .then((document) => setVerificationDocument(document))
      .catch((error) => {
        console.error('Failed to load Tinfoil verification', error)
      })
  }, [])

  return (
    <VerificationCenter
      isDarkMode
      showVerificationFlow
      verificationDocument={verificationDocument}
    />
  )
}
```

## Local Demo

A small Vite app in `examples/dev` renders the component against mock data.

```bash
npm install
npm run build # generates dist/ so the demo consumes the packaged bundle
npm run dev
```

Open the printed URL (defaults to http://localhost:5173) to explore the UI. The demo lets you toggle dark mode, collapse or expand the verification flow diagram, and switch between the built-in mock document and running the live verifier.

## Remote Demo

See it in action at [demo.tinfoil.sh](https://demo.tinfoil.sh).
