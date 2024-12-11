import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/nola-historic-districts",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
