import { WEIGHTS } from '../lib/matching';
import type { ScoreBreakdown as Breakdown } from '../lib/types';

const ROWS: { key: keyof Breakdown; label: string; max: number }[] = [
  { key: 'subject', label: 'Subject fit', max: WEIGHTS.subject },
  { key: 'compatibility', label: 'Compatibility', max: WEIGHTS.compatibility },
  { key: 'time', label: 'Time overlap', max: WEIGHTS.time },
  { key: 'coordinator', label: 'Coordinator', max: WEIGHTS.coordinator },
];

/** Weighted score bars — makes the relationship-centered weighting visible. */
export default function ScoreBreakdown({ breakdown }: { breakdown: Breakdown }) {
  return (
    <div className="breakdown">
      {ROWS.map(({ key, label, max }) => {
        const value = breakdown[key] ?? 0;
        const pct = Math.max(0, Math.min(100, (value / max) * 100));
        return (
          <div className="row" key={key}>
            <span className="k">{label}</span>
            <span className={`bar ${key}`}>
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="v">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
