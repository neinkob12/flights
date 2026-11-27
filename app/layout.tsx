import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fare Sniper",
  description: "Free flight price watcher. Set your max price, get a one-tap booking link the moment it hits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header className="top">
            <a className="logo" href="/">Fare<span>Sniper</span> 🎯</a>
            <nav><a href="/">Watch a flight</a><a href="/demo">Auto-hold demo</a></nav>
          </header>
          {children}
          <footer>
            Free and open source. Prices come from recent searches and are confirmed on the booking page. Not affiliated with any airline.
          </footer>
        </main>
      </body>
    </html>
  );
}
