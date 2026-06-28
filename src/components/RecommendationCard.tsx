import type { Recommendation } from '../lib/matching';
import type { Profile } from '../lib/types';
import ScoreBreakdown from './ScoreBreakdown';

interface Props {
  rec: Recommendation;
  /** Which side the viewer is looking at the *other* person from. */
  perspective: 'mentee' | 'mentor' | 'coordinator';
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

function counterpart(rec: Recommendation, perspective: Props['perspective']): Profile {
  // mentee viewing -> show mentor; mentor viewing -> show mentee;
  // coordinator -> show the mentor (mentee is chosen separately).
  return perspective === 'mentee' || perspective === 'coordinator'
    ? rec.mentor
    : rec.mentee;
}

export default function RecommendationCard({
  rec,
  perspective,
  actionLabel,
  onAction,
  disabled,
  secondaryLabel,
  onSecondary,
}: Props) {
  const person = counterpart(rec, perspective);
  const roleLabel = person.role === 'mentor' ? 'Mentor' : 'Mentee';

  return (
    <div className="card rec-card">
      <div className="rec-head">
        <div>
          <h3>{person.name}</h3>
          <p className="sub">
            {roleLabel} · Grade {person.grade}
            {person.is_new_student ? ' · new student' : ''}
          </p>
          <div className="chips">
            <span className="chip subject">{rec.subject}</span>
            {rec.styleMatch && <span className="chip match">style match</span>}
          </div>
        </div>
        <div className="score">
          <span className="num">{rec.score}</span>
          <span className="label">fit</span>
        </div>
      </div>

      <div className="rec-body">
        {person.bio && <p className="sub" style={{ marginBottom: '0.4rem' }}>{person.bio}</p>}

        {rec.commonInterests.length > 0 ? (
          <div className="chips">
            {rec.commonInterests.map((i) => (
              <span className="chip match" key={i}>● {i}</span>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
            No shared interests yet — connection may need extra coordinator care.
          </p>
        )}

        <ScoreBreakdown breakdown={rec.breakdown} />

        <div className="row-between" style={{ marginTop: '0.9rem' }}>
          {secondaryLabel && onSecondary ? (
            <button className="btn ghost small" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          ) : (
            <span />
          )}
          <button className="btn small" onClick={onAction} disabled={disabled}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
