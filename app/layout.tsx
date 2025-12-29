import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/src/components/Sidebar";
import { MobileSidebar } from "@/src/components/MobileSidebar"; 
import { ThemeProvider } from "@/src/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrepOS",
  description: "Placement Command Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        // 1. ADD THIS PROP HERE TO FIX THE ERROR
        suppressHydrationWarning={true} 
        className={`${inter.className} bg-background text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          
          <div className="relative min-h-screen">
            
            {/* 1. Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar">
              <Sidebar />
            </div>

            {/* 2. Mobile Sidebar (Handles Button + Drawer) */}
            <MobileSidebar />

            {/* 3. Main Content */}
            <main className="md:pl-64 min-h-screen transition-all duration-300">
              <div className="container mx-auto p-4 md:p-8 pt-16 md:pt-8">
                {children}
              </div>
            </main>
          </div>

        </ThemeProvider>
      </body>
    </html>
  );
}