import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One address for search engines: send www.mapdebut.com to mapdebut.com (permanent).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.mapdebut.com" }],
        destination: "https://mapdebut.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
