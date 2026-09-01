import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';

const VAR_RE = /\{\{\s*(\w+)\s*\}\}/g;

function extractVars(...strings) {
  const set = new Set();
  for (const s of strings) {
    const str = String(s || '');
    let m;
    VAR_RE.lastIndex = 0;
    // eslint-disable-next-line no-cond-assign
    while ((m = VAR_RE.exec(str))) set.add(m[1]);
  }
  return [...set];
}

function render(str, values) {
  return String(str || '').replace(VAR_RE, (_, k) => (values[k] != null && values[k] !== '' ? values[k] : `{{${k}}}`));
}

function buildMailto({ to, cc, bcc, subject, body }) {
  const parts = [];
  if (cc) parts.push(`cc=${encodeURIComponent(cc)}`);
  if (bcc) parts.push(`bcc=${encodeURIComponent(bcc)}`);
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${encodeURIComponent(to)}${parts.length ? `?${parts.join('&')}` : ''}`;
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

const DEFAULT_TEMPLATES = [
  {
    name: 'Interview Invitation',
    subject: 'Interview Invitation — {{role}}',
    body: 'Hi {{name}},\n\nWe were impressed by your profile and would like to invite you to interview for the {{role}} role.\n\nProposed time: {{time}}\nMode: {{mode}}\n\nPlease confirm your availability.\n\nBest regards,\n{{sender}}',
  },
  {
    name: 'Follow-up / Thank you',
    subject: 'Thank you, {{name}}',
    body: 'Hi {{name}},\n\nThank you for taking the time to talk with us about the {{role}} role. It was great learning about your experience.\n\nWe will be in touch with next steps shortly.\n\nBest,\n{{sender}}',
  },
  {
    name: 'Offer',
    subject: 'Offer — {{role}} for {{name}}',
    body: "Hi {{name}},\n\nWe're delighted to offer you the {{role}} position.\n\nStart date: {{startDate}}\n{{details}}\n\nWelcome aboard!\n\nRegards,\n{{sender}}",
  },
  {
    name: 'Reminder',
    subject: 'Reminder: {{topic}}',
    body: 'Hi {{name}},\n\nThis is a friendly reminder about {{topic}} on {{time}}.\n\nThanks,\n{{sender}}',
  },
];

export default function EmailComposer() {
  const { user, isAdmin } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [values, setValues] = useState({});
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [editing, setEditing] = useState(null); // template object being edited, or {new:true}

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'email_templates'), orderBy('createdAt', 'asc')));
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const selected = useMemo(() => templates.find((t) => t.id === selectedId) || null, [templates, selectedId]);
  const vars = useMemo(
    () => (selected ? extractVars(selected.subject, selected.body) : []),
    [selected],
  );

  // Reset the variable values when switching templates.
  useEffect(() => {
    setValues({});
  }, [selectedId]);

  if (!isAdmin) {
    return <EmptyState icon="🔒" title="Admins only" description="Email tools are available to admins." />;
  }

  const renderedSubject = selected ? render(selected.subject, values) : '';
  const renderedBody = selected ? render(selected.body, values) : '';

  const handleOpen = () => {
    if (!isEmail(to)) {
      window.alert('Please enter a valid recipient email.');
      return;
    }
    window.location.href = buildMailto({
      to: to.trim(),
      cc: cc.trim(),
      bcc: bcc.trim(),
      subject: renderedSubject,
      body: renderedBody,
    });
  };

  const seedDefaults = async () => {
    try {
      for (const t of DEFAULT_TEMPLATES) {
        // eslint-disable-next-line no-await-in-loop
        await addDoc(collection(db, 'email_templates'), {
          ...t,
          createdBy: user?.email || user?.uid || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await load();
    } catch (err) {
      console.error('Failed to seed templates:', err);
    }
  };

  const saveTemplate = async (tpl) => {
    const name = tpl.name.trim();
    if (!name) return;
    try {
      if (tpl.id) {
        await updateDoc(doc(db, 'email_templates', tpl.id), {
          name,
          subject: tpl.subject,
          body: tpl.body,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'email_templates'), {
          name,
          subject: tpl.subject,
          body: tpl.body,
          createdBy: user?.email || user?.uid || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setEditing(null);
      await load();
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const removeTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await deleteDoc(doc(db, 'email_templates', id));
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Email</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Pick a template, fill the details, and open it in your mail app to send.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ new: true, name: '', subject: '', body: '' })}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          + New template
        </button>
      </div>

      {editing ? (
        <TemplateEditor
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={saveTemplate}
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-surface-500 dark:text-surface-400">Loading…</p>
      ) : templates.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No templates yet"
          description="Add the sample templates to get started, or create your own."
          action={
            <button
              type="button"
              onClick={seedDefaults}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Add sample templates
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Template list */}
          <div className="space-y-1.5">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-1 rounded-lg border px-3 py-2 transition-colors ${
                  selectedId === t.id
                    ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                    : 'border-surface-200 bg-white hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:hover:bg-surface-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-surface-800 dark:text-surface-200"
                >
                  {t.name}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  className="rounded p-1 text-xs text-surface-400 opacity-0 transition-opacity hover:text-primary-600 group-hover:opacity-100"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => removeTemplate(t.id)}
                  className="rounded p-1 text-xs text-surface-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          {/* Compose */}
          {selected ? (
            <div className="space-y-4 rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="To (recipient email)" className="sm:col-span-3">
                  <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com" className={inputCls} />
                </Field>
                <Field label="Cc (optional)">
                  <input type="text" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@example.com" className={inputCls} />
                </Field>
                <Field label="Bcc (optional)">
                  <input type="text" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc@example.com" className={inputCls} />
                </Field>
              </div>

              {vars.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {vars.map((v) => (
                    <Field key={v} label={v}>
                      <input
                        type="text"
                        value={values[v] || ''}
                        onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`{{${v}}}`}
                        className={inputCls}
                      />
                    </Field>
                  ))}
                </div>
              ) : null}

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-surface-400 dark:text-surface-500">Preview</p>
                <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-950">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{renderedSubject}</p>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-surface-600 dark:text-surface-300">{renderedBody}</pre>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpen}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Open in email app
                </button>
                <span className="text-xs text-surface-400 dark:text-surface-500">Opens your mail client with everything prefilled.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-surface-200 p-10 text-sm text-surface-400 dark:border-surface-700 dark:text-surface-500">
              Select a template to compose.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200';

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">{label}</span>
      {children}
    </label>
  );
}

function TemplateEditor({ initial, onCancel, onSave }) {
  const [name, setName] = useState(initial.name || '');
  const [subject, setSubject] = useState(initial.subject || '');
  const [body, setBody] = useState(initial.body || '');

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-primary-300 bg-primary-50/40 p-4 dark:border-primary-700 dark:bg-primary-950/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">
          {initial.id ? 'Edit template' : 'New template'}
        </h3>
        <span className="text-[11px] text-surface-500 dark:text-surface-400">
          Use {'{{'}variable{'}}'} placeholders (e.g. {'{{'}name{'}}'}, {'{{'}role{'}}'}).
        </span>
      </div>
      <Field label="Template name">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Interview Invitation" className={inputCls} />
      </Field>
      <Field label="Subject">
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Interview Invitation — {{role}}" className={inputCls} />
      </Field>
      <Field label="Body">
        <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi {{name}}, …" className={`${inputCls} resize-y font-sans`} />
      </Field>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-medium text-surface-600 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave({ id: initial.id, name, subject, body })}
          disabled={!name.trim()}
          className="rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          Save template
        </button>
      </div>
    </div>
  );
}
