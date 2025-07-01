import "@/styles/globals.css";
import { Metadata } from "next";
import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Interactive Avatar",
    template: `%s - Interactive Avatar`,
  },
  description: "AI-powered interactive avatar conversations",
  keywords: ["AI", "Avatar", "Conversation", "Interactive"],
  authors: [{ name: "Interactive Avatar Team" }],
  creator: "Interactive Avatar Team",
  publisher: "Interactive Avatar Team",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/heygen-logo.png",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} font-sans`}
      lang="en"
    >
      <head />
      <body className="min-h-screen bg-black text-white overflow-hidden">
        <main className="relative h-screen w-screen">{children}</main>
      </body>
    </html>
  );
}