'use client'

import Script from 'next/script'

export default function UnicornBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10">
        <div data-us-project="bKN5upvoulAmWvInmHza" className="absolute inset-0" />
      </div>
      <Script
        src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
            // @ts-ignore
            UnicornStudio.init()
            // @ts-ignore
            window.UnicornStudio.isInitialized = true
          }
        }}
      />
    </>
  )
}
