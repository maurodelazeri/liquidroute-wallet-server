export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Porto's exact layout - transparent background, full height
  return (
    <html lang="en" className="bg-transparent" style={{ backgroundColor: 'transparent' }}>
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          html, :host {
            background-color: transparent !important;
          }
          html, body {
            height: 100%;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: transparent !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
          }
          #root {
            display: flex;
            width: 100%;
            max-width: 100vw;
            height: 100%;
            overflow-x: hidden;
          }
        `}} />
      </head>
      <body className="bg-transparent">
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
