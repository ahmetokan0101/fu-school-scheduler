import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Okul Ders Programı',
  description: 'Otomatik Okul Haftalık Ders Programı Dağıtım Sistemi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main className="pt-16 md:pt-8 p-3 sm:p-6 md:p-8 md:ml-[240px] min-h-screen max-w-7xl mx-auto transition-all">{children}</main>
      </body>
    </html>
  );
}
