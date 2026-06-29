import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopRail } from "@/components/dashboard/TopRail";
import { getSession } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal OS",
  description: "AI-native personal operating system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await getSession();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">
        {authed && <TopRail />}
        {children}
      </body>
    </html>
  );
}
