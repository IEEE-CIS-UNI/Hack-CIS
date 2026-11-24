import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // «Nube» pasó a llamarse «Cloud»: los enlaces que ya se compartieron siguen llegando a su página.
  async redirects() {
    return [{ source: "/tracks/nube", destination: "/tracks/cloud", permanent: true }];
  },
};

export default nextConfig;
