'use client';
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

  return (
    <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-slate-200 flex flex-col justify-between z-40 select-none shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
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
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menü
          </div>
          {navLinks.map(({ href, label, desc, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
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
        </nav>
      </div>
    </aside>
  );
}
