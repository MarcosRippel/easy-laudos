// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthWrapper from "../components/auth/AuthWrapper";
import PWAProvider from "../components/PWAProvider";

export const metadata: Metadata = {
  title: "GTS - General Truck System Inspetor",
  description: "Sistema de Emissão de Laudos - General Truck System Inspetor",
  keywords: ["laudos", "inspeção", "veículos", "General Truck System", "inspetor"],
  authors: [{ name: "General Truck System" }],
  applicationName: "GTS Inspetor",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GTS Inspetor",
  },
  icons: {
    icon: [
      { url: "/branding/favicon.png", type: "image/png", sizes: "any" },
      { url: "/branding/logo-bonito-simples.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/branding/favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    title: "GTS - General Truck System Inspetor",
    description: "Sistema de Emissão de Laudos - General Truck System Inspetor",
    siteName: "General Truck System Inspetor",
    images: [
      {
        url: "/branding/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "General Truck System Inspetor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GTS - General Truck System Inspetor",
    description: "Sistema de Emissão de Laudos - General Truck System Inspetor",
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
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <PWAProvider />
      </body>
    </html>
  );
}