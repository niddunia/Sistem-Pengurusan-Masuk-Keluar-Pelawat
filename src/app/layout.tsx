import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import SessionProviderWrapper from "@/components/vms/SessionProviderWrapper";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VMS PLTT Bintulu | Sistem Pengurusan Pelawat",
  description:
    "Sistem Pengurusan Masuk-Keluar Pelawat - Pusat Latihan Teknologi Tinggi Bintulu, Jabatan Tenaga Manusia (JTM)",
  keywords: [
    "VMS",
    "PLTT Bintulu",
    "JTM",
    "Visitor Management",
    "Pengurusan Pelawat",
  ],
  authors: [{ name: "PLTT Bintulu - JTM" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SessionProviderWrapper>
            <div className="app-bg">
              {children}
            </div>
            <Toaster />
            <SonnerToaster richColors position="top-right" />
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
