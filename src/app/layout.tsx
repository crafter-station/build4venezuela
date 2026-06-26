import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BUILD4VENEZUELA | Global Hackathon",
  description:
    "A global 72-hour hackathon to build useful tools for Venezuela after the June 24 earthquakes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
