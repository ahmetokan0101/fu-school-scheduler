'use client';
import { useState, useEffect } from 'react';
import { getClasses, createClass, updateClass, deleteClass } from '@/lib/api';
import type { ClassGroup } from '@/lib/api';

interface FormState {
  name: string;
  grade_level: string;
}

const EMPTY_FORM: FormState = { name: '', grade_level: '5' };

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassGroup | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setClasses(await getClasses());
      setPageError(null);
    } catch (e: any) {
      setPageError(e.detail ?? 'Sınıflar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: ClassGroup) {
    setEditing(c);
    setForm({ name: c.name, grade_level: String(c.grade_level) });
    setFormError(null);
    setModalOpen(true);
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'Sınıf adı zorunludur';
    const gl = parseInt(form.grade_level, 10);
    if (isNaN(gl) || gl < 1 || gl > 12) return 'Sınıf seviyesi 1 ile 12 arasında olmalıdır';
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setFormError(err); return; }
    setSaving(true);
    setFormError(null);
    const payload = { name: form.name.trim(), grade_level: parseInt(form.grade_level, 10) };
    try {
      if (editing) {
        const updated = await updateClass(editing.id, payload);
        setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await createClass(payload);
        setClasses(prev => [...prev, created]);
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
      await deleteClass(id);
      setClasses(prev => prev.filter(c => c.id !== id));
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sınıflar</h1>
          <p className="text-xs text-slate-500 mt-0.5">Şubeler ve sınıf kademeleri</p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-center shadow-xs"
        >
          + Yeni Sınıf Ekle
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
          <table className="w-full border-collapse min-w-[460px] sm:min-w-0">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sınıf Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Seviye / Kademe</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-16">
                    <div className="text-2xl mb-2">🏫</div>
                    <p className="text-slate-400 text-sm">Henüz sınıf eklenmedi.</p>
                    <p className="text-slate-300 text-xs mt-1">Yeni bir sınıf oluşturmak için &ldquo;Yeni Sınıf Ekle&rdquo; butonuna tıklayın.</p>
                  </td>
                </tr>
              ) : (
                classes.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.grade_level}. Sınıf</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deletingId === c.id ? 'Siliniyor...' : 'Sil'}
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
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-5">
              {editing ? 'Sınıfı Düzenle' : 'Yeni Sınıf'}
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sınıf Adı</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="ör. 5/A"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sınıf Seviyesi (Kademe)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.grade_level}
                onChange={e => setForm(f => ({ ...f, grade_level: e.target.value }))}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
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
