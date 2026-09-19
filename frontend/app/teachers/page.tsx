'use client';
import { useState, useEffect, useCallback } from 'react';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, getTimeslots } from '@/lib/api';
import type { Teacher, TimeSlot } from '@/lib/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Pzt', TUESDAY: 'Sal', WEDNESDAY: 'Çar', THURSDAY: 'Per', FRIDAY: 'Cum',
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

type SlotMap = Record<string, Record<number, TimeSlot>>;

function buildSlotMap(slots: TimeSlot[]): SlotMap {
  const map: SlotMap = {};
  for (const slot of slots) {
    if (!map[slot.day]) map[slot.day] = {};
    map[slot.day][slot.period] = slot;
  }
  return map;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [slotMap, setSlotMap] = useState<SlotMap>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [name, setName] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [ts, slots] = await Promise.all([getTeachers(), getTimeslots()]);
      setTeachers(ts);
      setTimeslots(slots);
      setSlotMap(buildSlotMap(slots));
      setPageError(null);
    } catch (e: any) {
      setPageError(e.detail ?? 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setSelectedSlotIds(new Set());
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setName(t.name);
    setSelectedSlotIds(new Set(t.available_slots.map(s => s.id)));
    setFormError(null);
    setModalOpen(true);
  }

  const toggleSlot = useCallback((slotId: string) => {
    setSelectedSlotIds(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }, []);

  async function handleSave() {
    if (!name.trim()) { setFormError('Öğretmen adı zorunludur'); return; }
    setSaving(true);
    setFormError(null);
    const payload = { name: name.trim(), available_slot_ids: Array.from(selectedSlotIds) };
    try {
      if (editing) {
        const updated = await updateTeacher(editing.id, payload);
        setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await createTeacher(payload);
        setTeachers(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.detail ?? 'Kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setPageError(null);
    try {
      await deleteTeacher(id);
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      setPageError(e.detail ?? 'Silinirken bir hata oluştu');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Öğretmenler</h1>
          <p className="text-xs text-slate-500 mt-0.5">Öğretmen listesi, haftalık müsaitlik ve izinli günler</p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-center shadow-xs"
        >
          + Yeni Öğretmen Ekle
        </button>
      </div>

      {pageError && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {pageError}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 py-12 text-center text-sm">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px] sm:min-w-0">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğretmen Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Müsait Ders Saatleri</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-16">
                    <div className="text-2xl mb-2">👨‍🏫</div>
                    <p className="text-slate-400 text-sm">Henüz öğretmen eklenmedi.</p>
                    <p className="text-slate-300 text-xs mt-1">Yeni bir öğretmen eklemek için &ldquo;Yeni Öğretmen Ekle&rdquo; butonuna tıklayın.</p>
                  </td>
                </tr>
              ) : (
                teachers.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{t.available_slots.length} / 35 saat</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deletingId === t.id ? 'Siliniyor...' : 'Sil'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-5">
              {editing ? 'Öğretmeni Düzenle' : 'Yeni Öğretmen'}
            </h2>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Öğretmen Adı Soyadı</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="ör. Tuba Hoca"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Müsaitlik Durumu <span className="text-amber-600 normal-case font-medium">({selectedSlotIds.size} saat seçili)</span>
                </label>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSlotIds(new Set(timeslots.map(s => s.id)))}
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlotIds(new Set())}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Temizle
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="w-12 pr-3 py-1 text-slate-400 font-dm-mono text-xs text-left">Saat</th>
                      {DAYS.map(d => (
                        <th key={d} className="w-12 px-1 py-1 text-center font-dm-mono text-xs text-slate-500 uppercase">
                          {DAY_LABELS[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map(period => (
                      <tr key={period}>
                        <td className="pr-3 py-1 font-dm-mono text-xs text-slate-500">{period}.D</td>
                        {DAYS.map(day => {
                          const slot = slotMap[day]?.[period];
                          const selected = slot ? selectedSlotIds.has(slot.id) : false;
                          return (
                            <td key={day} className="px-1 py-1">
                              <button
                                type="button"
                                disabled={!slot}
                                onClick={() => slot && toggleSlot(slot.id)}
                                className={`w-9 h-9 rounded text-xs font-medium transition-all ${
                                  selected
                                    ? 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-700'
                                    : 'bg-slate-100 text-transparent border border-slate-300 hover:bg-slate-200'
                                } disabled:opacity-30`}
                              >
                                {selected ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {formError && (
              <div className="text-red-600 text-sm mb-4">{formError}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
