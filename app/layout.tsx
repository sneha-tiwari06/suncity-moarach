import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PDFWorkerInit from "@/components/PDFWorkerInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Suncity Monarch Application Form",
  description: "Legal PDF application form system",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PDFWorkerInit />
        {children}
      </body>
    </html>
  );
}