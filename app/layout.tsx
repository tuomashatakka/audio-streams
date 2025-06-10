import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './styles/base.css'


const inter = Inter({ subsets: [ 'latin' ]})

export const metadata: Metadata = {
  title:       'Audio Streams - Web DAW Module',
  description: 'Web-based audio streaming and DAW module with drag-and-drop support and Web Worker-powered audio processing.',
  keywords:    [ 'audio', 'daw', 'web-audio', 'streaming', 'music', 'react', 'nextjs' ],
  authors:     [{ name: 'Audio Streams Team' }],
  creator:     'Audio Streams Team',
  robots:      {
    index:  true,
    follow: true,
  },
}

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout ({
  children,
}: RootLayoutProps) {
  return <html lang='en'>
    <head>
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <style dangerouslySetInnerHTML={{
        __html: `
            /* Critical CSS for initial load */
            @layer base {
              body {
                margin: 0;
                padding: 0;
                font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
                background-color: #121212;
                color: #ffffff;
                overflow: hidden;
              }

              #root {
                height: 100vh;
                width: 100vw;
              }

              /* Loading spinner */
              .loading {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
              }

              .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 85, 0, 0.2);
                border-radius: 50%;
                border-top-color: #ff5500;
                animation: spin 1s linear infinite;
              }

              @keyframes spin {
                to { transform: rotate(360deg); }
              }

              .loading-text {
                color: #aaaaaa;
                font-size: 14px;
              }
            }
          `
      }} />
    </head>
    <body className={ inter.className } suppressHydrationWarning>
      {children}
    </body>
  </html>
}
