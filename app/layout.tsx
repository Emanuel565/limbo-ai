import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Limbo AI",
  description: "Plataforma de análise de vídeos com IA para criadores de conteúdo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased liquid-glass-canvas min-h-screen text-slate-100 selection:bg-[#FF1493]/30 selection:text-white`}
      >
        <ClientWrapper>
          <Header />

          <main className="min-h-[calc(100vh-80px)]">{children}</main>

          <Toaster position="bottom-center" />
        </ClientWrapper>
      </body>
    </html>

  );
}