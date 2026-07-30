import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';
import { subjectColor } from '../lib/subjectColor';
import type { DiscussionTopic } from '../lib/types';
import { displayName, initial } from '../lib/names';

type SortOrder = 'new' | 'old';

/**
 * Global discussions hub (replaces the private inbox). Pick a course, search by
 * keyword, sort by date, and jump into any thread to talk with the class.
 */
export default function Discussions() {
  const {
    currentUser,
    discussionTopics,
    discussionPosts,
    classById,
    profileById,
    myClassIds,
  } = useApp();

  const [rawClassFilter, setClassFilter] = useState<string>('all');
  // Don't keep filtering by a course the current user isn't in.
  const classFilter = myClassIds.includes(rawClassFilter) ? rawClassFilter : 'all';
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOrder>('new');
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const myClasses = useMemo(
    () =>
      myClassIds
        .map((id) => classById(id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [myClassIds, classById],
  );

  const visibleTopics = useMemo(() => {
    const mine = new Set(myClassIds);
    const q = query.trim().toLowerCase();
    return discussionTopics
      .filter((t) => mine.has(t.class_id))
      .filter((t) => classFilter === 'all' || t.class_id === classFilter)
      .filter((t) => {
        if (!q) return true;
        if (t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)) return true;
        // also match if any reply in the thread contains the keyword
        return discussionPosts.some(
          (p) => p.topic_id === t.id && p.body.toLowerCase().includes(q),
        );
      })
      .sort((a, b) =>
        sort === 'new'
          ? b.created_at.localeCompare(a.created_at)
          : a.created_at.localeCompare(b.created_at),
      );
  }, [discussionTopics, discussionPosts, myClassIds, classFilter, query, sort]);

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  const openTopic = openTopicId
    ? discussionTopics.find((t) => t.id === openTopicId)
    : null;

  if (openTopic) {
    return <Thread topic={openTopic} onBack={() => setOpenTopicId(null)} />;
  }

  return (
    <div>
      <div className="page-head">
        <h1>Discussions</h1>
        <p>Talk with your classes — pick a course, search, and jump into a thread.</p>
      </div>

      <div className="disc-toolbar">
        <select
          className="select"
          aria-label="Filter by course"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="all">All my courses</option>
          {myClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            className="search-input"
            type="search"
            aria-label="Search discussions by keyword"
            value={query}
            placeholder="Search discussions by keyword…"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <select
          className="select"
          aria-label="Sort discussions by date"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOrder)}
        >
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
        </select>

        <button
          className={`btn small ${showNew ? "secondary" : ""}`}
          onClick={() => setShowNew((v) => !v)}
        >
          {showNew ? 'Cancel' : '+ New'}
        </button>
      </div>

      {showNew && (
        <NewTopicForm
          classes={myClasses}
          authorId={currentUser.id}
          onCreated={(id) => {
            setShowNew(false);
            setOpenTopicId(id);
          }}
        />
      )}

      {visibleTopics.length === 0 ? (
        <div className="empty">
          {query
            ? `No discussions match “${query}”.`
            : 'No discussions in these courses yet.'}
        </div>
      ) : (
        <ul className="plain-list boxed">
          {visibleTopics.map((t) => {
            const cls = classById(t.class_id);
            const replies = discussionPosts.filter((p) => p.topic_id === t.id).length;
            const color = cls ? subjectColor(cls.subject) : '#6f655b';
            return (
              <li key={t.id} className="list-row">
                <button className="disc-row-main" onClick={() => setOpenTopicId(t.id)}>
                  <span className="disc-title">💬 {t.title}</span>
                  <span className="disc-meta">
                    <span className="subject-chip">
                      <span className="legend-dot" style={{ background: color }} />
                      {cls?.name ?? 'Course'}
                    </span>{' '}
                    {displayName(profileById(t.author_id))} ·{' '}
                    {new Date(t.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </button>
                <span className="chip">{replies} repl{replies === 1 ? 'y' : 'ies'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NewTopicForm({
  classes,
  authorId,
  onCreated,
}: {
  classes: { id: string; name: string }[];
  authorId: string;
  onCreated: (topicId: string) => void;
}) {
  const { refresh } = useApp();
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!classId || !title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const topic = await repo.createDiscussionTopic({
        class_id: classId,
        author_id: authorId,
        title: title.trim(),
        body: body.trim(),
      });
      await refresh();
      onCreated(topic.id);
    } finally {
      setBusy(false);
    }
  };

  if (classes.length === 0) {
    return (
      <div className="empty" style={{ marginBottom: '1rem' }}>
        Join a course first to start a discussion.
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '0 0 220px' }}>
          <label>Course</label>
          <select aria-label="Course" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 240px' }}>
          <label>Topic title</label>
          <input aria-label="Topic title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Prompt</label>
        <textarea aria-label="Prompt" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="row-between">
        <span />
        <button className="btn small" disabled={!title.trim() || !body.trim() || busy} onClick={create}>
          {busy ? 'Posting…' : 'Start discussion'}
        </button>
      </div>
    </div>
  );
}

function Thread({ topic, onBack }: { topic: DiscussionTopic; onBack: () => void }) {
  const { currentUser, discussionPosts, classById, profileById, refresh } = useApp();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const cls = classById(topic.class_id);
  const posts = discussionPosts
    .filter((p) => p.topic_id === topic.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const post = async () => {
    if (!currentUser || !reply.trim()) return;
    setBusy(true);
    try {
      await repo.createDiscussionPost({
        topic_id: topic.id,
        author_id: currentUser.id,
        body: reply.trim(),
      });
      setReply('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const author = profileById(topic.author_id);

  return (
    <div>
      <button className="btn ghost small" onClick={onBack} style={{ paddingLeft: 0 }}>
        ← All discussions
      </button>
      <div className="row-between" style={{ margin: '0.25rem 0 0.25rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>💬 {topic.title}</h1>
        {cls && (
          <Link to={`/courses/${cls.id}/discussions`} className="chip">
            {cls.name} →
          </Link>
        )}
      </div>

      <div className="card" style={{ margin: '0.75rem 0 1.25rem' }}>
        <div className="inline" style={{ gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="avatar">{initial(author)}</span>
          <strong>{displayName(author)}</strong>
          {author?.role === 'teacher' && <span className="chip">Teacher</span>}
        </div>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{topic.body}</p>
      </div>

      <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.6rem' }}>
        {posts.length} repl{posts.length === 1 ? 'y' : 'ies'}
      </h3>
      <div className="stack" style={{ gap: '0.6rem' }}>
        {posts.map((p) => {
          const who = profileById(p.author_id);
          return (
            <div key={p.id} className="card subtle discussion-post">
              <div className="inline" style={{ gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span className="avatar">{initial(who)}</span>
                <strong>{displayName(who)}</strong>
                {who?.role === 'teacher' && <span className="chip">Teacher</span>}
                <span className="meta">
                  {new Date(p.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.body}</p>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label>Reply</label>
          <textarea
aria-label="Reply"             value={reply}
            placeholder="Add to the discussion…"
            onChange={(e) => setReply(e.target.value)}
          />
        </div>
        <div className="row-between">
          <span />
          <button className="btn small" disabled={!reply.trim() || busy} onClick={post}>
            {busy ? 'Posting…' : 'Post reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
