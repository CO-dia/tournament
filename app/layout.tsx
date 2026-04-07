import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tournoi de volley-ball | STK FJKM Canada Montreal",
  description: "Calendrier du tournoi, classement et outils d'administration",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-stk-navy/10 bg-white/50 py-5 text-center text-xs text-stk-navy/55">
          <span className="font-medium text-stk-navy/75">
            Sampana Tanora Kristiana
          </span>
          {" · "}
          FJKM Canada Montréal
        </footer>
      </body>
    </html>
  );
}
