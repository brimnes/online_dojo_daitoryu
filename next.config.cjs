/** @type {import('next').NextConfig} */
const nextConfig = {
  // Позволяет встраивать в WebView без X-Frame-Options блокировки
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // PWA: Allow "Add to Home Screen"
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // WebView: allow embedding
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Service worker scope
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
