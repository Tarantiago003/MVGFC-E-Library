
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name"    content="MVGFC E-Library"/>
        <meta name="apple-mobile-web-app-capable"           content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style"  content="default"/>
        <meta name="apple-mobile-web-app-title"             content="E-Library"/>
        <meta name="mobile-web-app-capable"                 content="yes"/>
        <meta name="theme-color"                            content="#1B5E20"/>
        <link rel="manifest"     href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icons/icon-192.png"/>
        <link rel="preconnect"   href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </Head>
      <body>
        <Main/>
        <NextScript/>
      </body>
    </Html>
  )
}
