import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Set to false only if you know what you're doing
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      // Arweave
      {
        protocol: "https",
        hostname: "arweave.net",
      },
      {
        protocol: "https",
        hostname: "www.arweave.net",
      },
      // Irys/Bundlr gateways
      {
        protocol: "https",
        hostname: "gateway.irys.xyz",
      },
      {
        protocol: "https",
        hostname: "node1.irys.xyz",
      },
      {
        protocol: "https",
        hostname: "node2.irys.xyz",
      },
      // IPFS
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "gateway.ipfs.io",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
      },
      // Common NFT storage providers
      {
        protocol: "https",
        hostname: "nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "*.nftstorage.link",
      },
      // Common image CDNs (for testing/demo purposes)
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.imgur.com",
      },
    ],
    unoptimized: process.env.NODE_ENV === "development", // Skip optimization in dev for faster builds
  },
};

export default nextConfig;
