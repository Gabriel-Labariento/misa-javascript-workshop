import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "My mini site",
  description: "Built at the MISA web development workshop.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <strong>My mini site</strong>
          <nav className="site-nav">
            <Link href="/">Home</Link>
          </nav>
        </header>

        <main className="site-main">{children}</main>

        <footer className="site-footer">
          Made at the MISA web development workshop
        </footer>
      </body>
    </html>
  );
}
