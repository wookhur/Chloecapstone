import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';

export default function AnnouncementsTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, announcements, profileById, refresh } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const list = announcements
    .filter((a) => a.class_id === cls.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const post = async () => {
    if (!currentUser || !title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await repo.createAnnouncement({
        class_id: cls.id,
        author_id: currentUser.id,
        title: title.trim(),
        body: body.trim(),
      });
      setTitle('');
      setBody('');
      setShowForm(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Announcements</h2>
        {isCourseTeacher && (
          <button className="btn small" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Announcement'}
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
            <label>Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="row-between">
            <span />
            <button className="btn small" disabled={!title.trim() || !body.trim() || busy} onClick={post}>
              {busy ? 'Posting…' : 'Post announcement'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">No announcements yet.</div>
      ) : (
        <div className="stack" style={{ gap: '0.75rem' }}>
          {list.map((an) => (
            <div key={an.id} className="card">
              <div className="row-between">
                <strong>{an.title}</strong>
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  {new Date(an.created_at).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="sub" style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{an.body}</p>
              <div className="row-between" style={{ marginTop: '0.6rem' }}>
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  — {profileById(an.author_id)?.name}
                </span>
                {isCourseTeacher && (
                  <button
                    className="btn ghost small"
                    onClick={async () => {
                      await repo.deleteAnnouncement(an.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
