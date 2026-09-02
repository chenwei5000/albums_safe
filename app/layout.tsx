import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ParticleField } from '@/components/particle-field';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Album Safe · Edge 数据管理台',
  description: '使用 Edge API 与 Blob 构建的轻量图片数据管理台。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 全站暗色氛围背景（渐变底 + 粒子），内容层统一置于其上 */}
        <ParticleField />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
