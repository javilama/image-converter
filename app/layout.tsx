import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
//import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";


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
        className= {`relative bg-gradient-to-br from-king-blue via-black to-king-blue min-h-screen  ${poppins.variable}`} 
      >
         <div className="absolute inset-0 bg-white/3 backdrop-blur-md"></div>
          <div className="relative z-10">

            {children}
          <Footer />
          </div>
        
      </body>
    </html>
  );
}
