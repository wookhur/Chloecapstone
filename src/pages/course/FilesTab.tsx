import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo, CourseFile } from '../../lib/types';
import { displayName } from '../../lib/names';
import Icon, { type IconName } from '../../components/Icon';
import {
  MAX_UPLOAD_MB,
  downloadUrl,
  formatSize,
  isDownloadable,
  sizeInKb,
  uploadFile,
  uploadProblem,
} from '../../lib/storage';

const FILE_ICONS: [RegExp, IconName][] = [
  [/\.pdf$/i, 'file'],
  [/\.(png|jpe?g|gif|webp)$/i, 'image'],
  [/\.(docx?|txt|md)$/i, 'file'],
  [/\.(xlsx?|csv)$/i, 'sheet'],
  [/\.(pptx?)$/i, 'slides'],
];

const iconFor = (name: string): IconName =>
  FILE_ICONS.find(([re]) => re.test(name))?.[1] ?? 'paperclip';

/**
 * Course handouts. The teacher picks a real file; the bytes go to Storage and
 * students open them from here — the point being that the worksheet lives next
 * to the due date instead of in an email thread from three weeks ago.
 */
export default function FilesTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, files, profileById, refresh } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const list = files
    .filter((f) => f.class_id === cls.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const onPick = async (picked: FileList | null) => {
    const file = picked?.[0];
    if (!file || !currentUser) return;

    const why = uploadProblem(file);
    if (why) {
      setProblem(why);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setProblem(null);
    setBusy(true);
    try {
      // Bytes first: a row pointing at nothing is worse than no row at all.
      const path = await uploadFile(cls.id, file);
      await repo.createFile({
        class_id: cls.id,
        name: file.name,
        size_kb: sizeInKb(file.size),
        storage_path: path,
        uploaded_by: currentUser.id,
      });
      await refresh();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const open = async (f: CourseFile) => {
    try {
      const url = await downloadUrl(f.storage_path!);
      if (url) window.open(url, '_blank', 'noopener');
      else setProblem(`${f.name} is no longer in storage.`);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    }
  };

  const remove = async (f: CourseFile) => {
    setProblem(null);
    try {
      await repo.deleteFile(f.id, f.storage_path);
      await refresh();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: '1rem' }}>Files</h2>

      {isCourseTeacher && (
        <div className="card subtle" style={{ marginBottom: '1rem' }}>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Upload a handout</span>
            <input
              ref={inputRef}
              type="file"
              disabled={busy}
              onChange={(e) => onPick(e.target.files)}
            />
          </label>
          <p className="meta" style={{ margin: '0.5rem 0 0' }}>
            {busy ? 'Uploading…' : `Up to ${MAX_UPLOAD_MB} MB. Everyone in ${cls.name} can open it.`}
          </p>
        </div>
      )}

      {problem && (
        <div className="banner error" role="alert" style={{ marginBottom: '1rem' }}>
          <span className="dot" />
          {problem}
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
                  <Icon name={iconFor(f.name)} className="file-glyph" />{' '}
                  {isDownloadable(f.storage_path) ? (
                    <button className="linklike" onClick={() => open(f)}>
                      <strong>{f.name}</strong>
                    </button>
                  ) : (
                    <>
                      <strong>{f.name}</strong>
                      <span className="meta"> · sample file, nothing to open</span>
                    </>
                  )}
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
                      aria-label={`Delete ${f.name}`}
                      onClick={() => remove(f)}
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
