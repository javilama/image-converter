import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
//import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300','400','600','700'], 
  variable: '--font-poppins',        
  display: 'swap',                   // reduce CLS
});

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Convertidor de imágenes",
  description: "Convierte tus imagenes al formato que desees (WebP, PNG, JPG)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="{poppins.className}">
      <body
        className= {`min-h-screen bg-gradient-to-br from-dark-night to-king-blue text-white ${poppins.variable}`} 
      >
        {children}
      </body>
    </html>
  );
}
