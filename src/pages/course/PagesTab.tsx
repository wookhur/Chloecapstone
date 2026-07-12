import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';

/** Canvas Pages: wiki-style course content. List, view, and (teacher) edit. */
export default function PagesTab({ cls }: { cls: ClassInfo }) {
  const { pageId } = useParams<{ pageId: string }>();
  return pageId ? <PageView cls={cls} pageId={pageId} /> : <PageList cls={cls} />;
}

function PageList({ cls }: { cls: ClassInfo }) {
  const { currentUser, pages, refresh } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const list = pages
    .filter((p) => p.class_id === cls.id)
    .sort((a, b) => a.title.localeCompare(b.title));

  const create = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const page = await repo.createPage({
        class_id: cls.id,
        title: title.trim(),
        body: body.trim(),
        updated_at: new Date().toISOString(),
      });
      await refresh();
      navigate(`../pages/${page.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Pages</h2>
        {isCourseTeacher && (
          <button className="btn small" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Page'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Content</label>
            <textarea value={body} style={{ minHeight: 140 }} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="row-between">
            <span />
            <button className="btn small" disabled={!title.trim() || !body.trim() || busy} onClick={create}>
              {busy ? 'Creating…' : 'Create page'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">No pages yet.</div>
      ) : (
        <ul className="plain-list boxed">
          {list.map((p) => (
            <li key={p.id} className="list-row">
              <Link to={`../pages/${p.id}`} style={{ fontWeight: 600 }}>
                📃 {p.title}
              </Link>
              <span className="muted" style={{ fontSize: '0.78rem' }}>
                Updated{' '}
                {new Date(p.updated_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PageView({ cls, pageId }: { cls: ClassInfo; pageId: string }) {
  const { currentUser, pages, refresh } = useApp();
  const page = pages.find((p) => p.id === pageId && p.class_id === cls.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  if (!page) return <div className="empty">Page not found.</div>;
  const isCourseTeacher = currentUser?.id === cls.teacher_id;

  const save = async () => {
    setBusy(true);
    try {
      await repo.updatePage(page.id, { body: draft });
      setEditing(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link to="../pages" className="muted" style={{ fontSize: '0.82rem' }}>
        ← All pages
      </Link>
      <div className="row-between" style={{ margin: '0.5rem 0 0.75rem' }}>
        <h2 style={{ margin: 0 }}>📃 {page.title}</h2>
        {isCourseTeacher && !editing && (
          <button
            className="btn secondary small"
            onClick={() => { setDraft(page.body); setEditing(true); }}
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="card">
          <div className="field">
            <textarea value={draft} style={{ minHeight: 220 }} onChange={(e) => setDraft(e.target.value)} />
          </div>
          <div className="row-between">
            <button className="btn secondary small" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn small" disabled={busy} onClick={save}>
              {busy ? 'Saving…' : 'Save page'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{page.body}</div>
      )}

      <p className="muted" style={{ fontSize: '0.76rem', marginTop: '0.6rem' }}>
        Last updated{' '}
        {new Date(page.updated_at).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}
