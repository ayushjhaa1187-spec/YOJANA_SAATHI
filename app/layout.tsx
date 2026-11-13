import type { Metadata, Viewport } from "next";
import { Baloo_2, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const baloo2 = Baloo_2({
  subsets: ["devanagari", "latin"],
  weight: ["600", "700"],
  variable: "--font-baloo-2",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "योजना साथी | Yojana Saathi",
  description: "बोलकर जानिए सरकारी योजनाएँ - Voice-first Government Scheme Assistant",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B2A6B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" className={`${baloo2.variable} ${notoSansDevanagari.variable}`}>
      <body className="min-h-screen bg-dhuli text-neel font-body antialiased flex flex-col items-center">
        <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-dhuli">
          {children}
        </div>
      </body>
    </html>
  );
}
