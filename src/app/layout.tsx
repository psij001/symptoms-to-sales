import type { Metadata } from "next";
import { Inter, Spectral } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Symptoms to Sales",
  description: "Professional writing tools for deal-makers who care about craft",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spectral.variable} font-sans antialiased bg-background-deep text-text-primary`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
