const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
})

module.exports = withPWA({
  reactStrictMode: true,
  images: { domains: ['drive.google.com', 'lh3.googleusercontent.com'] }
})