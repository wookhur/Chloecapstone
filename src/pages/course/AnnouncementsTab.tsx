import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';
import { displayName } from '../../lib/names';
import EmptyState from '../../components/EmptyState';

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
      <div className="row-between mb-4">
        <h2 className="section-title">Announcements</h2>
        {isCourseTeacher && (
          <button
            className={`btn small ${showForm ? "secondary" : ""}`}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : '+ Announcement'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="field">
            <label>Title</label>
            <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea aria-label="Message" value={body} onChange={(e) => setBody(e.target.value)} />
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
        <EmptyState icon="pin" title="No announcements yet">
          <p>Notices the teacher sends to the whole class land here.</p>
        </EmptyState>
      ) : (
        <div className="stack gap-3">
          {list.map((an) => (
            <div key={an.id} className="card">
              <div className="row-between">
                <strong>{an.title}</strong>
                <span className="meta">
                  {new Date(an.created_at).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="sub post-body caption">{an.body}</p>
              <div className="row-between mt-3">
                <span className="meta">
                  — {displayName(profileById(an.author_id))}
                </span>
                {isCourseTeacher && (
                  <button
                    className="btn danger small"
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
