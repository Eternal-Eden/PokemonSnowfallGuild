import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { AgreementProvider } from '@/contexts/AgreementContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { UpdateProvider } from '@/contexts/UpdateContext';
import { AuthGuard } from '@/components/auth';
import { BackgroundCarousel } from '@/components/background/BackgroundCarousel';
import { ParticleBackground } from '@/components/animations/AnimationComponents';
import MainNavigation from '@/components/navigation/MainNavigation';
import Footer from '@/components/layout/Footer';
import PerformanceMonitorProvider from '@/components/performance/PerformanceMonitorProvider';
import UpdateNotification from '@/components/update/UpdateNotification';
import UpdateIndicator from '@/components/update/UpdateIndicator';
import ErrorBoundary from '@/components/ErrorBoundary';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "落雪公会管理系统 - Pokemon Snowfall Guild",
  description: "落雪公会宝可梦公会管理系统，提供会员管理、数据统计等功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <PerformanceMonitorProvider>
            <SettingsProvider>
              <AgreementProvider>
                <AuthProvider>
                  <MessageProvider>
                    <UpdateProvider>
                    <BackgroundCarousel />
                    <AuthGuard>
                      <ParticleBackground />
                      <MainNavigation />
                      <div className="relative z-10 min-h-screen flex flex-col">
                        <main className="flex-1">
                          {children}
                        </main>
                        <Footer />
                      </div>
                      {/* 更新通知组件 */}
                      <UpdateNotification />
                      {/* 更新状态指示器 */}
                      <UpdateIndicator position="bottom-right" />
                    </AuthGuard>
                    </UpdateProvider>
                  </MessageProvider>
                </AuthProvider>
              </AgreementProvider>
            </SettingsProvider>
          </PerformanceMonitorProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
