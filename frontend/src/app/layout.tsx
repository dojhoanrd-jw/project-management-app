import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AlertProvider } from "@/context/AlertContext";
import SWRProvider from "@/context/SWRProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PM",
  description: "Project management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <SWRProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
