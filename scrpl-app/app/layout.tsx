import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UTS SCRPL App",
  description:
    "Get RPL subject suggestions based on your current institution and course.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 p-16 text-white">{children}</body>
    </html>
  );
}
