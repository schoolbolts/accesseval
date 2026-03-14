'use client';

import { useState, useEffect } from 'react';

export default function StatementPage() {
  const [form, setForm] = useState({
    entityName: '',
    entityType: 'school_district',
    contactEmail: '',
    contactPhone: '',
  });
  const [publicUrl, setPublicUrl] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);

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
    const res = await fetch('/api/statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setHtml(data.statement.statementHtml);
      setPublicUrl(data.publicUrl);
    }
    setSaving(false);
  }

  const entityTypes = [
    { id: 'school_district', label: 'School District' },
    { id: 'municipality', label: 'Municipality' },
    { id: 'library', label: 'Library' },
    { id: 'special_district', label: 'Special District' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Accessibility Statement</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Entity name</label>
            <input type="text" value={form.entityName}
              onChange={(e) => setForm((f) => ({ ...f, entityName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Entity type</label>
            <select value={form.entityType}
              onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg">
              {entityTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact email</label>
            <input type="email" value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact phone (optional)</label>
            <input type="tel" value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Generate Statement'}
          </button>
          {publicUrl && (
            <p className="text-sm text-gray-500">
              Public URL: <a href={publicUrl} target="_blank" className="text-blue-600">{publicUrl}</a>
            </p>
          )}
        </form>

        {/* Preview */}
        <div className="border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Preview</h2>
          {html ? (
            <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="text-gray-400 text-sm">Fill in the form and click Generate to preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}
