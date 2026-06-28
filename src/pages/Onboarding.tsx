import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProfileForm, {
  draftToProfile,
  emptyDraft,
  type ProfileDraft,
} from '../components/ProfileForm';
import * as repo from '../lib/repository';

export default function Onboarding() {
  const { refresh, setCurrentUserId } = useApp();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const canSubmit = draft.name.trim() && draft.subjectName.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const created = await repo.upsertProfile(draftToProfile(draft));
      await refresh();
      setCurrentUserId(created.id);
      navigate('/recommendations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Join Yeon</h1>
        <p>
          Tell us your subject, your interests, and how you like to communicate.
          Yeon matches on people, not just grades.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <ProfileForm draft={draft} onChange={setDraft} />
        <div className="row-between" style={{ marginTop: '0.5rem' }}>
          <span className="muted" style={{ fontSize: '0.82rem' }}>
            You can refine all of this later from your Profile.
          </span>
          <button className="btn" onClick={submit} disabled={!canSubmit || saving}>
            {saving ? 'Creating…' : 'Create profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
