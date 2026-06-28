import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ProfileForm, {
  draftFromProfile,
  draftToProfile,
  type ProfileDraft,
} from '../components/ProfileForm';
import * as repo from '../lib/repository';

export default function Profile() {
  const { currentUser, refresh } = useApp();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'coordinator') {
      setDraft(draftFromProfile(currentUser));
    } else {
      setDraft(null);
    }
  }, [currentUser]);

  if (!currentUser) return <div className="empty">No profile selected.</div>;

  if (currentUser.role === 'coordinator') {
    return (
      <div>
        <div className="page-head">
          <h1>{currentUser.name}</h1>
          <p>Coordinator & community lead — you connect people and care for the matches.</p>
        </div>
        <div className="card" style={{ maxWidth: 560 }}>
          <p className="sub">{currentUser.bio}</p>
          <div className="chips">
            {currentUser.interests.map((i) => (
              <span className="chip" key={i}>{i}</span>
            ))}
          </div>
          <div className="divider" />
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Head to the <strong>Coordinator</strong> tab to review matches, monitor
            relationship health, and export the school report.
          </p>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await repo.upsertProfile({ ...draftToProfile(draft), id: currentUser.id });
      await refresh();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>My Profile</h1>
        <p>Keep this fresh — better signal means better matches.</p>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <ProfileForm draft={draft} onChange={(d) => { setDraft(d); setSaved(false); }} lockRole />
        <div className="row-between" style={{ marginTop: '0.5rem' }}>
          <span className="muted" style={{ fontSize: '0.82rem' }}>
            {saved ? 'Saved ✓' : 'Changes are not saved until you click Save.'}
          </span>
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
