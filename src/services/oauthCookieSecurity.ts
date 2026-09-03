export function shouldUseSecureCookies(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'production') return true;
  const appUrl = env.APP_URL || env.RENDER_EXTERNAL_URL || '';
  return /^https:\/\//i.test(appUrl);
}
