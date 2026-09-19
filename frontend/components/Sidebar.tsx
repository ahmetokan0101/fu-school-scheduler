'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/schedule', label: 'Ders Programı', desc: 'Haftalık program & dağıtım', icon: '🗓️' },
  { href: '/teachers', label: 'Öğretmenler', desc: 'Müsaitlik ve boş günler', icon: '👨‍🏫' },
  { href: '/classes', label: 'Sınıflar', desc: 'Şubeler ve kademeler', icon: '🏫' },
  { href: '/subjects', label: 'Dersler', desc: 'Ders havuzu', icon: '📚' },
  { href: '/courses', label: 'Ders Atamaları', desc: 'Öğretmen-sınıf eşleşmeleri', icon: '📖' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navContent = (
    <>
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Menü
        </div>
        {navLinks.map(({ href, label, desc, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200/70 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                {icon}
              </span>
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-semibold leading-none ${active ? 'text-amber-900' : 'text-slate-800'}`}>
                  {label}
                </span>
                <span className="text-[10px] text-slate-400 truncate mt-1 leading-none font-normal">
                  {desc}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-600">Okul Ders Planlayıcı</p>
        <p className="text-[10px] text-slate-400 mt-0.5">MEB 7 Saatlik Blok Dağıtım</p>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile Top Bar (Screens < md) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 flex items-center justify-between shadow-xs no-print">
        <Link href="/schedule" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 font-bold text-sm shadow-xs">
            📅
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-slate-900 leading-tight">
              Ders Planlayıcı
            </span>
            <span className="text-[9px] text-slate-400 leading-none">
              Okul Dağıtım
            </span>
          </div>
        </Link>

        <button
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Menüyü Aç/Kapat"
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* ── Mobile Drawer Backdrop & Menu (Screens < md) ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 font-bold text-sm">
                    📅
                  </div>
                  <span className="font-bold text-sm text-slate-900">Ders Planlayıcı</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="pt-2">{navContent}</nav>
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop Sidebar (Screens >= md) ── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-slate-200 flex-col justify-between z-40 select-none shadow-[1px_0_10px_rgba(0,0,0,0.02)] no-print">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 font-bold text-base shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                📅
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-900 tracking-tight leading-tight group-hover:text-amber-600 transition-colors">
                  Ders Planlayıcı
                </span>
                <span className="text-[11px] font-medium text-slate-400 tracking-wide mt-0.5">
                  Okul Dağıtım Sistemi
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-1">{navContent}</nav>
        </div>
      </aside>
    </>
  );
}
