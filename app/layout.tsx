import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CommonGround AI — A little less strangers.",
  description:
    "Discover unexpected cultural connections through your favorite movies, music, books, and more.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
