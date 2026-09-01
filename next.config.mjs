/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        // The site root is not meant to advertise what is hosted here; the
        // class pages are reached by their direct URLs. Temporary (307) on
        // purpose, so browsers do not cache this the way they cache a 308.
        source: "/",
        destination: "https://www.google.com",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
