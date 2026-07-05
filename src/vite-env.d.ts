/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_ENDPOINT: string | undefined
  readonly VITE_GITHUB_CLIENT_ID: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
