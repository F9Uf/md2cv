/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_ENDPOINT: string
  readonly VITE_GITHUB_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
