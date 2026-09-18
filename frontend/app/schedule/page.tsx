'use client';
import { useState, useEffect } from 'react';
import {
  generateSchedule,
  getLatestSchedule,
  getScheduleByClass,
  getScheduleByTeacher,
  getClasses,
  getTeachers,
} from '@/lib/api';
import type { Schedule, ScheduleEntry, ConflictReport, ClassGroup, Teacher } from '@/lib/api';
import ScheduleGrid from '@/components/ScheduleGrid';
import ConflictReportComponent from '@/components/ConflictReport';

type ViewMode = 'class' | 'teacher';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('class');
  const [selectedId, setSelectedId] = useState<string>('');
  const [filteredEntries, setFilteredEntries] = useState<ScheduleEntry[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const [latestSchedule, cls, tch] = await Promise.allSettled([
          getLatestSchedule(),
          getClasses(),
          getTeachers(),
        ]);

        if (cls.status === 'fulfilled') setClasses(cls.value);
        if (tch.status === 'fulfilled') setTeachers(tch.value);

        if (latestSchedule.status === 'fulfilled') {
          setSchedule(latestSchedule.value);
          setFilteredEntries(latestSchedule.value.entries);
        }
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!schedule) return;
    setSelectedId('');
    setFilteredEntries(schedule.entries);
  }, [viewMode, schedule]);

  async function handleSelectId(id: string) {
    setSelectedId(id);
    if (!id) {
      setFilteredEntries(schedule?.entries ?? []);
      return;
    }
    try {
      const entries =
        viewMode === 'class'
          ? await getScheduleByClass(id)
          : await getScheduleByTeacher(id);
      setFilteredEntries(entries);
    } catch {
      setFilteredEntries([]);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setConflictReport(null);
    try {
      const result = await generateSchedule();
      setSchedule(result);
      setFilteredEntries(result.entries);
      setSelectedId('');
    } catch (err: unknown) {
      const e = err as { status?: number; detail?: unknown };
      if (e.status === 422 && e.detail && typeof e.detail === 'object') {
        const detail = e.detail as { reason?: ConflictReport };
        if (detail.reason) {
          setConflictReport(detail.reason);
          setSchedule(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const dropdownItems = viewMode === 'class' ? classes : teachers;
  const selectedItem = dropdownItems.find(i => i.id === selectedId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Haftalık Ders Programı</h1>
          <p className="text-xs text-slate-500 mt-1">7 derslik blok ders düzeni ve çakışmasız haftalık dağıtım</p>
        </div>
        <div className="flex items-center gap-2">
          {schedule && (
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Yazdır / PDF İndir</span>
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? 'Program Oluşturuluyor...' : 'Ders Programı Oluştur'}
          </button>
        </div>
      </div>

      {conflictReport && (
        <div className="mb-6 no-print">
          <ConflictReportComponent
            report={conflictReport}
            onRetry={handleGenerate}
          />
        </div>
      )}

      {initialLoading ? (
        <div className="text-slate-400 py-12 text-center text-sm">Yükleniyor...</div>
      ) : !schedule ? (
        !conflictReport && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-slate-700 font-semibold mb-1">Henüz ders programı oluşturulmadı.</p>
            <p className="text-slate-400 text-sm">
              Başlamak için <span className="font-semibold text-slate-700">Ders Programı Oluştur</span> butonuna tıklayın.
            </p>
          </div>
        )
      ) : (
        <div>
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
            <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('class')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'class'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🏫 Sınıfa Göre
              </button>
              <button
                onClick={() => setViewMode('teacher')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'teacher'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👨‍🏫 Öğretmene Göre
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Filtrele:</label>
              <select
                value={selectedId}
                onChange={(e) => handleSelectId(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm"
              >
                <option value="">{viewMode === 'class' ? 'Tüm Sınıflar (Toplu Baskı)' : 'Tüm Öğretmenler (Toplu Baskı)'}</option>
                {dropdownItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Screen & Single Item Print View */}
          {selectedId !== '' ? (
            <ScheduleGrid
              entries={filteredEntries}
              viewMode={viewMode}
              title={viewMode === 'class' ? `${selectedItem?.name} SINIFI HAFTALIK DERS PROGRAMI` : `${selectedItem?.name} HAFTALIK DERS PROGRAMI`}
              subtitle={viewMode === 'class' ? `Şube: ${selectedItem?.name}` : `Öğretmen: ${selectedItem?.name}`}
            />
          ) : (
            <>
              {/* Screen view for all */}
              <div className="no-print">
                <ScheduleGrid
                  entries={filteredEntries}
                  viewMode={viewMode}
                  title="TÜM HAFTALIK DERS DAĞITIMI"
                />
              </div>

              {/* Multi-page Print View: Renders each class or teacher on separate page in PDF! */}
              <div className="print-only space-y-6">
                {dropdownItems.map((item) => {
                  const itemEntries = schedule.entries.filter(e =>
                    viewMode === 'class'
                      ? e.course.class_group.id === item.id
                      : e.course.teacher.id === item.id
                  );
                  return (
                    <ScheduleGrid
                      key={item.id}
                      entries={itemEntries}
                      viewMode={viewMode}
                      title={viewMode === 'class' ? `${item.name} SINIFI HAFTALIK DERS PROGRAMI` : `${item.name} HAFTALIK DERS PROGRAMI`}
                      subtitle={viewMode === 'class' ? `Sınıf: ${item.name}` : `Öğretmen: ${item.name}`}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
