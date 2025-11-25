import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  // Build version for cache busting - changes on every deployment
  const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || Date.now().toString();

  return (
    <Html lang="en">
      <Head>
        {/* Build version for cache busting */}
        <meta name="build-version" content={buildVersion} />

        {/* Meta tags for SEO and responsiveness */}
        <meta name="description" content="FibreFlow - Fiber Network Project Management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Any additional head tags can be added here */}
      </Head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}