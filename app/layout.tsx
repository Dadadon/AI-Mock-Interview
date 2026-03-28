import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Montserrat, Bebas_Neue } from "next/font/google";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Neat Gigz — Career Hub",
  description:
    "Jamaica's AI-powered gig marketplace. Find local work, get screened instantly by voice AI, and connect with employers across the island.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${montserrat.variable} ${bebasNeue.variable} font-montserrat antialiased pattern`}
      >
        {children}
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
