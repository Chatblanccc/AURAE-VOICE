/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Sets up a global HTTP proxy dispatcher so that Node.js built-in fetch
 * (undici) respects HTTPS_PROXY / HTTP_PROXY in development.
 */
export async function register() {
  const proxyUrl =
    process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;

  if (proxyUrl && typeof globalThis.fetch !== 'undefined') {
    try {
      const { ProxyAgent, setGlobalDispatcher } = await import('undici');
      setGlobalDispatcher(new ProxyAgent(proxyUrl));
      console.log(`[proxy] Global fetch proxy set → ${proxyUrl}`);
    } catch (e) {
      console.warn('[proxy] Failed to set global proxy dispatcher:', e);
    }
  }
}
