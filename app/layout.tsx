// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthWrapper from "../components/auth/AuthWrapper";
import PWAProvider from "../components/PWAProvider";

export const metadata: Metadata = {
  title: "General Inspetor",
  description: "General Inspetor — Plataforma profissional de laudos técnicos.",
  keywords: ["laudos", "inspeção", "veículos", "General Truck System", "inspetor", "SASSMAQ"],
  authors: [{ name: "General Truck System" }],
  applicationName: "General Inspetor",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "General Inspetor",
  },
  icons: {
    icon: [
      { url: "/branding/favicon.svg?v=3", type: "image/svg+xml" },
      { url: "/branding/favicon.png?v=3", type: "image/png", sizes: "32x32" },
      { url: "/branding/logo-bonito-simples-transparent.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/branding/favicon.svg?v=3", type: "image/svg+xml" }],
    apple: [
      { url: "/branding/favicon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    title: "General Inspetor",
    description: "Plataforma profissional de laudos técnicos com conformidade SASSMAQ e ISO.",
    siteName: "General Inspetor",
    images: [
      {
        url: "/branding/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "General Inspetor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "General Inspetor",
    description: "Plataforma profissional de laudos técnicos.",
    images: ["/branding/og-image.jpg"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://generalinspetor.terpens.com.br"),
};

export const viewport: Viewport = {
  themeColor: "#007bff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <PWAProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </PWAProvider>
      </body>
    </html>
  );
}