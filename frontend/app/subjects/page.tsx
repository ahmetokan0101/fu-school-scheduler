'use client';
import { useState, useEffect } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/lib/api';
import type { Subject } from '@/lib/api';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setSubjects(await getSubjects());
      setPageError(null);
    } catch (e: any) {
      setPageError(e.detail ?? 'Dersler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setName(s.name);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) { setFormError('Ders adı zorunludur'); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updateSubject(editing.id, { name: name.trim() });
        setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await createSubject({ name: name.trim() });
        setSubjects(prev => [...prev, created]);
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
      await deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dersler</h1>
          <p className="text-xs text-slate-500 mt-0.5">Okul müfredat ders havuzu</p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-center shadow-xs"
        >
          + Yeni Ders Ekle
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
          <table className="w-full border-collapse min-w-[420px] sm:min-w-0">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ders Adı</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-16">
                    <div className="text-2xl mb-2">📚</div>
                    <p className="text-slate-400 text-sm">Henüz ders eklenmedi.</p>
                    <p className="text-slate-300 text-xs mt-1">Yeni bir ders eklemek için &ldquo;Yeni Ders Ekle&rdquo; butonuna tıklayın.</p>
                  </td>
                </tr>
              ) : (
                subjects.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deletingId === s.id ? 'Siliniyor...' : 'Sil'}
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
              {editing ? 'Dersi Düzenle' : 'Yeni Ders'}
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ders Adı</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="ör. Matematik"
                autoFocus
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
