import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev server on localhost without cross-origin warnings from Razorpay iframe.
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
