'use client';
import { useState } from 'react';
import type { ScheduleEntry } from '@/lib/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Pazartesi',
  TUESDAY: 'Salı',
  WEDNESDAY: 'Çarşamba',
  THURSDAY: 'Perşembe',
  FRIDAY: 'Cuma',
};
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Pzt',
  TUESDAY: 'Sal',
  WEDNESDAY: 'Çar',
  THURSDAY: 'Per',
  FRIDAY: 'Cum',
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

interface Props {
  entries: ScheduleEntry[];
  viewMode: 'class' | 'teacher';
  title?: string;
  subtitle?: string;
}

type CellMap = Record<string, Record<number, ScheduleEntry>>;

function buildCellMap(entries: ScheduleEntry[]): CellMap {
  const map: CellMap = {};
  for (const entry of entries) {
    const { day, period } = entry.time_slot;
    if (!map[day]) map[day] = {};
    map[day][period] = entry;
  }
  return map;
}

export default function ScheduleGrid({ entries, viewMode, title, subtitle }: Props) {
  const cellMap = buildCellMap(entries);
  const [selectedMobileDay, setSelectedMobileDay] = useState<string>('ALL');

  const printDate = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="print-page w-full">
      {/* Official Institutional Print Header */}
      <div className="print-only mb-3 border-b-2 border-slate-800 pb-2">
        <div className="flex items-center justify-between text-slate-900">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-600">T.C. MİLLÎ EĞİTİM BAKANLIĞI</p>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              {title || (viewMode === 'class' ? 'SINIF HAFTALIK DERS PROGRAMI' : 'ÖĞRETMEN HAFTALIK DERS PROGRAMI')}
            </h2>
            {subtitle && <p className="text-xs font-semibold text-amber-700">{subtitle}</p>}
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <p className="font-bold text-slate-800">2026-2027 Eğitim Öğretim Yılı</p>
            <p>Tarih: {printDate}</p>
          </div>
        </div>
      </div>

      {/* ── Mobile Day Selector (Screens < sm, hidden on print) ── */}
      <div className="sm:hidden no-print mb-3">
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setSelectedMobileDay('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedMobileDay === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Haftalık Tablo
          </button>
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedMobileDay(d)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedMobileDay === d
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {DAY_SHORT[d]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile Single Day Card List View (when a specific day is selected on < sm) ── */}
      {selectedMobileDay !== 'ALL' && (
        <div className="sm:hidden no-print space-y-2 mb-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {DAY_LABELS[selectedMobileDay]} Günü Dersleri
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">7 Saat</span>
          </div>

          {PERIODS.map((period) => {
            const entry = cellMap[selectedMobileDay]?.[period];
            if (!entry) {
              return (
                <div
                  key={period}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400"
                >
                  <span className="w-16 font-dm-mono text-xs font-semibold text-slate-400">
                    {period}. Ders
                  </span>
                  <span className="text-xs font-medium text-slate-300">Boş Saat</span>
                </div>
              );
            }
            const subjectName = entry.course.subject.name;
            const metaName =
              viewMode === 'class'
                ? entry.course.teacher.name
                : entry.course.class_group.name;

            return (
              <div
                key={period}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs border-l-[4px] border-l-amber-500"
              >
                <div className="flex items-center gap-3">
                  <span className="w-14 font-dm-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-center">
                    {period}. Ders
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{subjectName}</p>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">{metaName}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Grid Table (Full view: shown always on >= sm or when 'ALL' is selected on mobile, and always on print) ── */}
      <div
        className={`${
          selectedMobileDay !== 'ALL' ? 'hidden sm:block' : 'block'
        } overflow-x-auto rounded-xl border border-slate-200 shadow-sm print:border-slate-200 print:shadow-none print:rounded-none`}
      >
        <table className="w-full border-collapse text-sm min-w-[620px] sm:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 print:bg-amber-500/10 print:border-slate-300">
              <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-16 sm:w-20 border-r border-slate-200 print:border-slate-300 print:text-slate-900">
                Saat
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-2 sm:px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200 last:border-0 print:border-slate-300 print:text-slate-900"
                >
                  <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period} className="border-b border-slate-100 last:border-0 print:border-slate-200">
                <td className="px-2 sm:px-3 py-2.5 font-dm-mono text-xs text-slate-700 font-semibold bg-slate-50 border-r border-slate-200 print:border-slate-300 print:bg-slate-50 print:text-slate-900 text-center">
                  {period}. Ders
                </td>
                {DAYS.map((day) => {
                  const entry = cellMap[day]?.[period];
                  if (!entry) {
                    return (
                      <td
                        key={day}
                        className="px-2 py-2 bg-[#FAFAFA] border-r border-slate-100 last:border-0 print:bg-white print:border-slate-200"
                      >
                        <span className="text-slate-300 text-[10px] block text-center print:hidden">—</span>
                      </td>
                    );
                  }
                  const subjectName = entry.course.subject.name;
                  const metaName =
                    viewMode === 'class'
                      ? entry.course.teacher.name
                      : entry.course.class_group.name;
                  return (
                    <td
                      key={day}
                      className="px-0 py-0 border-r border-slate-100 last:border-0 print:border-slate-200 align-top"
                    >
                      <div className="border-l-[3.5px] border-amber-500 bg-white px-2 py-1.5 sm:px-2.5 sm:py-2 h-full print:border-l-[3.5px] print:border-amber-500 print:bg-amber-50/30 print:p-2">
                        <p className="font-bold text-slate-900 text-[11px] sm:text-xs leading-snug">
                          {subjectName}
                        </p>
                        <p className="text-slate-500 text-[10px] sm:text-[11px] font-medium mt-0.5 print:text-[9.5px] print:text-amber-800">
                          {metaName}
                        </p>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
