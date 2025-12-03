// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AuthWrapper from "../components/auth/AuthWrapper";

export const metadata: Metadata = {
  title: "GTS - General Truck System Inspetor",
  description: "Sistema de Emissão de Laudos - General Truck System Inspetor",
  keywords: ["laudos", "inspeção", "veículos", "General Truck System", "inspetor"],
  authors: [{ name: "General Truck System" }],
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    title: "GTS - General Truck System Inspetor",
    description: "Sistema de Emissão de Laudos - General Truck System Inspetor",
    siteName: "General Truck System Inspetor",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "General Truck System Inspetor Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GTS - General Truck System Inspetor",
    description: "Sistema de Emissão de Laudos - General Truck System Inspetor",
    images: ["/logo.png"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://gs.terpens.com.br"),
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
      </body>
    </html>
  );
}