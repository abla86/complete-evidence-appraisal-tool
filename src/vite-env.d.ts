interface ImportMetaEnv {
  readonly VITE_ENABLE_LOCAL_RESEARCH_PERSISTENCE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_VERSION?: string;
  readonly [key: string]: string | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
