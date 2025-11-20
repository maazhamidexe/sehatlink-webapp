import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sehat Link - Healthcare Agent Interface",
  description: "Futuristic healthcare assistant interface with AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="unicorn-background" aria-hidden="true">
            <div
              data-us-project="Ehgw5KinUgnV4r009l1z"
              style={{ width: "1440px", height: "900px" }}
            />
          </div>
          <div className="app-surface">{children}</div>
        </AuthProvider>
        <Script id="unicorn-studio" strategy="afterInteractive">{`
!function(){
  if(!window.UnicornStudio){
    window.UnicornStudio={isInitialized:!1};
    var i=document.createElement("script");
    i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.35/dist/unicornStudio.umd.js";
    i.onload=function(){
      if(!window.UnicornStudio.isInitialized){
        UnicornStudio.init();
        window.UnicornStudio.isInitialized=!0;
      }
    };
    (document.head || document.body).appendChild(i);
  }
}();
        `}</Script>
      </body>
    </html>
  );
}
