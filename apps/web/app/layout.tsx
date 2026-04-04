
import type { Metadata } from "next";
import { GeistSans, GeistMono } from 'geist/font';
import { Providers } from "@/components/providers"
import '@repo/ui/globals.css';
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

import './globals.css';

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "TaskFlow is a task management tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange >
          <Providers>
            <QueryProvider>
              {children}
            </QueryProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}