/**
 * The placeholder shown while the first load is in flight.
 *
 * It draws the dashboard's shape — a heading, a row of course cards, a list of
 * upcoming work — rather than the word "Loading". On school wifi that wait is
 * long enough to notice, and a blocked-out page keeps the eye where the content
 * is about to be instead of making it re-find everything when the data lands.
 *
 * It is decoration, not information: the whole thing is hidden from screen
 * readers and a single polite status message stands in for it, so a student
 * using VoiceOver hears "Loading" once instead of a stack of empty regions.
 */
export default function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      <span className="visually-hidden" role="status">Loading…</span>
      <div className="skeleton-page" aria-hidden="true">
        <div className="page-head">
          <div className="skel skel-title skel-w-40 mb-2" />
          <div className="skel skel-line skel-w-70" />
        </div>

        <div className="grid cols-2 mb-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skel-card">
              <div className="skel skel-line skel-w-55 mb-3" />
              <div className="skel skel-line skel-w-90 mb-2" />
              <div className="skel skel-line skel-w-40" />
            </div>
          ))}
        </div>

        <div className="skel skel-line skel-w-25 mb-3" />
        <div className="stack">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="skel-card">
              <div className="skel skel-line skel-w-70 mb-2" />
              <div className="skel skel-line skel-w-25" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
