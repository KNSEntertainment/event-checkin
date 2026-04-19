/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: '/api/admin/:path*',
        has: [
          {
            type: 'header',
            key: 'x-admin-email',
            value: process.env.SUPER_ADMIN_EMAIL,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
