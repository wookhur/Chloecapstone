import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';
import { displayName } from '../../lib/names';

const FILE_ICONS: [RegExp, string][] = [
  [/\.pdf$/i, '📕'],
  [/\.(png|jpe?g|gif|webp)$/i, '🖼️'],
  [/\.(docx?|txt|md)$/i, '📄'],
  [/\.(xlsx?|csv)$/i, '📊'],
  [/\.(pptx?)$/i, '📽️'],
];

const iconFor = (name: string) => FILE_ICONS.find(([re]) => re.test(name))?.[1] ?? '📎';

const formatSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

/** Canvas Files tab — metadata-only for now (storage comes in a later phase). */
export default function FilesTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, files, profileById, refresh } = useApp();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const list = files
    .filter((f) => f.class_id === cls.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const add = async () => {
    if (!currentUser || !name.trim()) return;
    setBusy(true);
    try {
      await repo.createFile({
        class_id: cls.id,
        name: name.trim(),
        size_kb: Math.max(1, Math.round(name.length * 13.7)), // placeholder size
        uploaded_by: currentUser.id,
      });
      setName('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: "1rem" }}>Files</h2>

      {isCourseTeacher && (
        <div className="card subtle" style={{ marginBottom: '1rem' }}>
          <div className="inline" style={{ gap: '0.6rem' }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <input
                value={name}
                aria-label="File name"
                placeholder="filename.pdf — real uploads come with storage in a later phase"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button className="btn small" disabled={!name.trim() || busy} onClick={add}>
              {busy ? 'Adding…' : 'Add file'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">No files yet.</div>
      ) : (
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Uploaded by</th>
              <th>Date</th>
              {isCourseTeacher && <th />}
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id}>
                <td>
                  {iconFor(f.name)} <strong>{f.name}</strong>
                </td>
                <td>{formatSize(f.size_kb)}</td>
                <td>{displayName(profileById(f.uploaded_by))}</td>
                <td>
                  {new Date(f.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                {isCourseTeacher && (
                  <td>
                    <button
                      className="btn danger small"
                      onClick={async () => {
                        await repo.deleteFile(f.id);
                        await refresh();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
