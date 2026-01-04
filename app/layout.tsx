import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@components/Sidebar";
import { MobileSidebar } from "@components/MobileSidebar"; 
import { ThemeProvider } from "@components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stratify",
  description: "Stratify helps candidates prepare with structure and measurable progress.",
  icons: {
    icon: `/stratify.svg`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. Wrap the entire HTML in ClerkProvider
    <ClerkProvider afterSignOutUrl="/?message=logout-success"
    afterSignInUrl="/?message=login-success"
    
    dynamic={true}>
      <html lang="en" suppressHydrationWarning>
        <body 
          suppressHydrationWarning={true} 
          className={`${inter.className} bg-black text-foreground antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            
            <div className="relative min-h-screen">
              
              {/* Desktop Sidebar */}
              <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar">
                <Sidebar />
              </div>

              {/* Mobile Sidebar */}
              <MobileSidebar />

              {/* Main Content */}
              <main className="md:pl-64 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 pt-16 md:pt-8">
                  {children}
                </div>
              </main>
            </div>

          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}