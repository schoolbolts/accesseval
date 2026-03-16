'use client';

import { useState, useEffect } from 'react';

const entityTypes = [
  { id: 'school_district', label: 'School District' },
  { id: 'municipality', label: 'Municipality' },
  { id: 'library', label: 'Library' },
  { id: 'special_district', label: 'Special District' },
];

export default function StatementForm() {
  const [form, setForm] = useState({
    entityName: '',
    entityType: 'school_district',
    contactEmail: '',
    contactPhone: '',
  });
  const [publicUrl, setPublicUrl] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/statement')
      .then((r) => r.json())
      .then((data) => {
        if (data.statement) {
          setForm({
            entityName: data.statement.entityName,
            entityType: data.statement.entityType,
            contactEmail: data.statement.contactEmail,
            contactPhone: data.statement.contactPhone || '',
          });
          setHtml(data.statement.statementHtml);
        }
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setHtml(data.statement.statementHtml);
      setPublicUrl(data.publicUrl);
    } else {
      setError(data.error || 'Something went wrong');
    }
    setSaving(false);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Form card */}
      <div className="card p-6 animate-fade-up stagger-1">
        <h2 className="section-title mb-5">Statement details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Entity name</label>
            <input
              type="text"
              value={form.entityName}
              onChange={(e) => setForm((f) => ({ ...f, entityName: e.target.value }))}
              className="input"
              placeholder="Riverside Unified School District"
              required
            />
          </div>
          <div>
            <label className="label">Entity type</label>
            <select
              value={form.entityType}
              onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
              className="select"
            >
              {entityTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Contact email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              className="input"
              placeholder="webmaster@district.org"
              required
            />
          </div>
          <div>
            <label className="label">
              Contact phone <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              className="input"
              placeholder="(555) 000-0000"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-2">
            {saving ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Saving...
              </>
            ) : (
              'Generate Statement'
            )}
          </button>
          {error && (
            <p className="text-sm font-body text-red-600 mt-2">{error}</p>
          )}
          {publicUrl && (
            <p className="text-sm font-body text-slate-600 pt-1">
              Public URL:{' '}
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-800 hover:underline">
                {publicUrl}
              </a>
            </p>
          )}
        </form>
      </div>

      {/* Preview card */}
      <div className="card p-6 animate-fade-up stagger-2">
        <h2 className="section-title mb-5">Preview</h2>
        {html ? (
          <div className="prose-ae" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" />
                <polyline points="12 2 12 6 16 6" />
                <line x1="7" y1="10" x2="13" y2="10" />
                <line x1="7" y1="13" x2="11" y2="13" />
              </svg>
            </div>
            <p className="text-sm font-body text-slate-600">Fill in the form and click Generate to preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}
