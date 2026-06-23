import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hamilog | Volunteer Logistics",
  description:
    "Volunteer logistics command center — coordinate drivers, manage missions, and deliver goods efficiently.",
  keywords: ["logistics", "volunteer", "dispatch", "driver", "delivery"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} dark`}>
      <body
        className="font-[family-name:var(--font-inter)] antialiased"
        style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        {children}
      </body>
    </html>
  );
}
