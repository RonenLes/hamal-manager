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

// Renders the root layout component.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('hamilog-theme') || 'dark';
                  document.documentElement.classList.add('theme-' + theme);
                } catch(e) {
                  document.documentElement.classList.add('theme-dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-[family-name:var(--font-inter)] antialiased bg-app text-main"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
