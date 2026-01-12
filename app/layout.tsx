import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PDFWorkerInit from "@/components/PDFWorkerInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Suncity Monarch Application Form",
  description: "Legal PDF application form system",
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