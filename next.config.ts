import type { NextConfig } from "next";

function getCspConnectSrc(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  let origin: string;
  let wsHost: string;
  try {
    const url = new URL(apiUrl);
    origin = url.origin;
    wsHost = url.host;
  } catch {
    origin = "";
    wsHost = "";
  }
  const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
  const parts = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
  ];
  if (origin) {
    parts.push(`connect-src 'self' ${origin} ${wsProtocol}://${wsHost}`);
  } else {
    parts.push("connect-src 'self'");
  }
  parts.push("frame-ancestors 'none'");
  return parts.join("; ");
}

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: getCspConnectSrc(),
  },
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  devIndicators: false,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/__nextjs(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
