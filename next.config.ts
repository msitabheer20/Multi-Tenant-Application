import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil"
    });

    return config;
  },

  images: {
    domains: [
      "hslc2pahn6.ufs.sh",
      "uploadthing.com",
      "utfs.io"
    ]
  },
  devIndicators: false
};

export default nextConfig;
