/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        // The class is the only thing hosted here, so the bare domain goes
        // straight to it. Temporary (307) on purpose, so browsers do not cache
        // this the way they cache a 308.
        source: "/",
        destination: "/umkc/govtacctclass",
        permanent: false,
      },
      {
        // The references moved under the dashboard they support; keep the old
        // link working.
        source: "/umkc/govtacctclass/references",
        destination: "/umkc/govtacctclass/dashboard/references",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
