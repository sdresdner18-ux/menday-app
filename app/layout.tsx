import type { Metadata } from "next";
import Script from "next/script";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeInit from "@/components/ThemeInit";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Mendy Orders",
  description: "Order management for custom manufacturing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} dark`} suppressHydrationWarning>
      <body className="font-nunito antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){var d=document.documentElement;try{var t=localStorage.getItem('mendy-theme');var dark=t!=='light';d.classList.toggle('dark',dark);d.style.colorScheme=dark?'dark':'light'}catch(e){d.classList.add('dark');d.style.colorScheme='dark'}})()`}
        </Script>
        <ThemeInit />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
