import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightMail - AI Email Analysis",
  description: "Smart email analysis with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
