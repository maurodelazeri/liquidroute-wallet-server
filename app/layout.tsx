import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiquidRoute",
  description: "Secure passkey wallet for Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-transparent">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="antialiased overflow-hidden bg-transparent h-full">
        <div id="root" className="flex w-full max-w-[100vw] h-full overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
