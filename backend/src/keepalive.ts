export function startKeepAliveCron() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;

  if (!externalUrl) {
    return;
  }

  const pingUrl = `${externalUrl.replace(/\/$/, '')}/api/health`;
  const intervalMs = 14 * 60 * 1000;

  console.log(`Render keep-alive cron active: Pinging ${pingUrl} every 14 minutes.`);

  const timer = setInterval(async () => {
    try {
      const response = await fetch(pingUrl, {
        headers: { 'User-Agent': 'Chaturanga-KeepAlive/1.0' },
      });
      if (response.ok) {
        console.log(`[KeepAlive] Ping successful at ${new Date().toISOString()}`);
      } else {
        console.warn(`[KeepAlive] Ping returned status ${response.status} at ${new Date().toISOString()}`);
      }
    } catch (err: any) {
      console.error(`[KeepAlive] Ping failed:`, err?.message || err);
    }
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}
