import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AI Yield Allocator | Octant DeFi Hackathon",
  description: "AI-driven yield allocation across DeFi protocols with automated public goods donations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t py-6 md:py-0">
              <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  Built for Octant v2 DeFi Hackathon 2025
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Powered by AI • ERC-4626 • Public Goods
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
