# Tinfoil Verification Center UI

Self‑contained Web Component that renders the Tinfoil verification center UI inside a Shadow DOM. It bundles React and styles internally, so you don’t need React in your app.

## Installation

```bash
npm install @tinfoilsh/verification-center-ui
```

Default usage requires only a modern browser with ES modules. No React in the host app is required.

## Usage

Default usage defines a self-contained Web Component that renders inside a Shadow DOM and bundles React + styles internally.

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

<!-- Place the element anywhere in your page -->
<tinfoil-verification-center
  is-dark-mode="true"
  show-verification-flow="true"
  config-repo="tinfoilsh/confidential-inference-proxy"
  base-url="https://inference.tinfoil.sh"
></tinfoil-verification-center>
```

When no `verificationDocument` prop is supplied the component will call `loadVerifier()` from the `tinfoil` package.
Otherwise, you can provide `verificationDocument` when the Tinfoil client is initialized successfully in your application. 

### Props

`VerificationCenter` exposes a small set of props so you can integrate it with the rest of your UI:

- `isDarkMode?: boolean` – toggles the dark theme (defaults to `true`).
- `showVerificationFlow?: boolean` – hides the network diagram when `false` (defaults to `true`).
- `verificationDocument?: VerificationDocument` – supply a precomputed verification document to skip running the verifier in the browser.
- `configRepo?: string` – override the GitHub repo the verifier pulls measurement configs from (defaults to `tinfoilsh/confidential-inference-proxy`).
- `baseUrl?: string` – override the enclave host/base URL that the verifier attests against (defaults to `https://inference.tinfoil.sh`).

React components are no longer exported. The package ships only the Web Component for a simpler installation and integration story.

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
  is-dark-mode="true"
  show-verification-flow="true"
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
- `is-dark-mode` (boolean, default `true`)
- `show-verification-flow` (boolean, default `true`)
- `config-repo` (string)
- `base-url` (string)
- `verificationDocument` (property only)

Nothing else is required — React, styles, and icons are bundled inside the component and fully isolated via Shadow DOM.
