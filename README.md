# Tinfoil Verification Center UI

Self‑contained Web Component that renders the Tinfoil verification center UI inside a Shadow DOM. It bundles its own runtime and styles; no React is required in your app.

## Installation

```bash
npm install @tinfoilsh/verification-center-ui
```

Default usage requires only a modern browser with ES modules. No React in the host app is required.

## Usage

Default usage defines a self-contained Web Component that renders inside a Shadow DOM and bundles its own runtime and styles.

```html
<!-- Register the custom element (ESM) -->
<script type="module">
  import '@tinfoilsh/verification-center-ui'
  // Custom element <tinfoil-verification-center> is now defined
  // Optional: you can set properties after mount
  window.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('tinfoil-verification-center')
    // el.verificationDocument = { ... } // when available
  })
  </script>

<!-- Place the element anywhere in your page (embedded). Provide a host height. -->
<tinfoil-verification-center
  mode="embedded"
  is-dark-mode="true"
  show-verification-flow="true"
  style="height: min(80vh, 680px); width: min(720px, 100%); overflow: hidden; border-radius: 8px;"
  config-repo="tinfoilsh/confidential-inference-proxy"
  base-url="https://inference.tinfoil.sh"
></tinfoil-verification-center>

<!-- Sidebar: fixed right panel with built-in header and close -->
<tinfoil-verification-center
  mode="sidebar"
  open
  is-dark-mode="true"
  show-verification-flow="true"
  sidebar-width="420"
></tinfoil-verification-center>

<!-- Modal: full-screen overlay with centered panel -->
<tinfoil-verification-center mode="modal" open is-dark-mode="true"></tinfoil-verification-center>
```

When no `verificationDocument` prop is supplied the component will call `loadVerifier()` from the `tinfoil` package. Otherwise, you can provide `verificationDocument` when the Tinfoil client is initialized successfully in your application.

### Props

The component exposes a small set of attributes/properties so you can integrate it with the rest of your UI:

- `is-dark-mode?: boolean` – toggles the dark theme (defaults to `true`).
- `show-verification-flow?: boolean` – hides the network diagram when `false` (defaults to `true`).
- `verificationDocument?: VerificationDocument` – property to supply a precomputed verification document to skip running the verifier in the browser.
- `config-repo?: string` – override the GitHub repo the verifier pulls measurement configs from (defaults to `tinfoilsh/confidential-inference-proxy`).
- `base-url?: string` – override the enclave host/base URL that the verifier attests against (defaults to `https://inference.tinfoil.sh`).

### Using the result from `TinfoilAI`

If your app already initializes a `TinfoilAI` client you can reuse its verification document instead of triggering another attestation pass. Set it on the Web Component as a property:

```html
<script type="module">
  import '@tinfoilsh/verification-center-ui'
  import { TinfoilAI } from 'tinfoil'

  async function init() {
    const client = new TinfoilAI({
      apiKey: '<YOUR_API_KEY>',
      baseURL: 'https://inference.tinfoil.sh',
    })
    await client.ready()
    const doc = await client.getVerificationDocument()

    const el = document.querySelector('tinfoil-verification-center')
    if (el) el.verificationDocument = doc
  }

  init().catch(console.error)
</script>

<tinfoil-verification-center is-dark-mode="true" show-verification-flow="true"></tinfoil-verification-center>
```

## Local Demo

A small Vite app in `examples/dev` renders the component against mock data.

```bash
npm install
npm run build # generates dist/ so the demo consumes the packaged bundle
npm run dev
```

Open the printed URL (defaults to http://localhost:5173) to explore the UI. The demo lets you toggle dark mode, collapse or expand the verification flow diagram, switch between the built-in mock documents, and choose a display mode: Sidebar, Modal, or Web Component (Shadow DOM).

## Remote Demo

See it in action at [demo.tinfoil.sh](https://demo.tinfoil.sh).

## Web Component (Shadow DOM)

The package provides a completely self-contained UI that won’t leak styles or depend on your app’s React. It renders inside a Shadow DOM and includes all required dependencies.

Install as usual, then import the package (default WC) once and place the element anywhere in your page or app:

```html
<!-- ESM import (bundlers) -->
<script type="module">
  import '@tinfoilsh/verification-center-ui'
  // custom element <tinfoil-verification-center> is now defined
</script>

<tinfoil-verification-center
  mode="embedded"
  is-dark-mode="true"
  show-verification-flow="true"
  style="height: min(80vh, 680px); width: min(720px, 100%); overflow: hidden; border-radius: 8px;"
  config-repo="tinfoilsh/confidential-inference-proxy"
  base-url="https://inference.tinfoil.sh"
></tinfoil-verification-center>
```

You can also set the `verificationDocument` as a property from JavaScript when you already have one from your app’s Tinfoil client:

```ts
import '@tinfoilsh/verification-center-ui'

const el = document.querySelector('tinfoil-verification-center')!
el.verificationDocument = myVerificationDocument // object from tinfoil client
```

Supported attributes/properties:
- `mode` ("embedded" | "sidebar" | "modal"; default `embedded`)
- `open` (boolean; for `sidebar`/`modal` to show/hide UI)
- `sidebar-width` (number in px; default `420` when `mode="sidebar"`)
- `is-dark-mode` (boolean, default `true`)
- `show-verification-flow` (boolean, default `true`)
- `config-repo` (string)
- `base-url` (string)
- `verificationDocument` (property only)

### Close event (sidebar and modal)

The built-in header includes a close button. When clicked, the component:
- Removes the `open` attribute (hides itself), and
- Dispatches a `close` event on the custom element.

Vanilla JS:

```html
<tinfoil-verification-center id="vc" mode="sidebar" open></tinfoil-verification-center>
<script type="module">
  import '@tinfoilsh/verification-center-ui'
  const el = document.getElementById('vc')
  el.addEventListener('close', () => {
    // Optional: sync your app state or analytics
    console.log('Verification Center closed')
  })
  // To reopen later:
  function openVc() { el.setAttribute('open', '') }
  function closeVc() { el.removeAttribute('open') }
  window.openVc = openVc
  window.closeVc = closeVc
  
  // If you already have a verification document:
  // el.verificationDocument = myVerificationDocument
  
</script>
```

React:

```tsx
import { useEffect, useRef, useState } from 'react'
import '@tinfoilsh/verification-center-ui'

export function Example() {
  const ref = useRef<any>(null)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onClose = () => setOpen(false)
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [])

  return (
    <tinfoil-verification-center
      ref={ref}
      mode="modal"
      open={open as any}
    />
  )
}
```

Note for React users: for hyphenated boolean attributes on custom elements (e.g., `is-dark-mode`, `show-verification-flow`), pass string values `'true' | 'false'` to keep the attribute present during toggles.

Nothing else is required — React, styles, and icons are bundled inside the component and fully isolated via Shadow DOM.
