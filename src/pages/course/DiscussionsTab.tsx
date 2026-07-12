import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';

/** Discussions: topic list, or a single thread when :topicId is present. */
export default function DiscussionsTab({ cls }: { cls: ClassInfo }) {
  const { topicId } = useParams<{ topicId: string }>();
  return topicId ? <TopicThread cls={cls} topicId={topicId} /> : <TopicList cls={cls} />;
}

function TopicList({ cls }: { cls: ClassInfo }) {
  const { currentUser, discussionTopics, discussionPosts, profileById, refresh } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const topics = discussionTopics
    .filter((t) => t.class_id === cls.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const create = async () => {
    if (!currentUser || !title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const topic = await repo.createDiscussionTopic({
        class_id: cls.id,
        author_id: currentUser.id,
        title: title.trim(),
        body: body.trim(),
      });
      await refresh();
      navigate(`../discussions/${topic.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Discussions</h2>
        <button className="btn small" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Discussion'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="field">
            <label>Topic title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Prompt</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="row-between">
            <span />
            <button className="btn small" disabled={!title.trim() || !body.trim() || busy} onClick={create}>
              {busy ? 'Posting…' : 'Start discussion'}
            </button>
          </div>
        </div>
      )}

      {topics.length === 0 ? (
        <div className="empty">No discussions yet — start one!</div>
      ) : (
        <ul className="plain-list boxed">
          {topics.map((t) => {
            const replies = discussionPosts.filter((p) => p.topic_id === t.id).length;
            return (
              <li key={t.id} className="list-row">
                <div>
                  <Link to={`../discussions/${t.id}`} style={{ fontWeight: 600 }}>
                    💬 {t.title}
                  </Link>
                  <div className="muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>
                    {profileById(t.author_id)?.name} ·{' '}
                    {new Date(t.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <span className="chip">{replies} repl{replies === 1 ? 'y' : 'ies'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TopicThread({ cls, topicId }: { cls: ClassInfo; topicId: string }) {
  const { currentUser, discussionTopics, discussionPosts, profileById, refresh } = useApp();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const topic = discussionTopics.find((t) => t.id === topicId && t.class_id === cls.id);
  if (!topic) return <div className="empty">Discussion not found.</div>;

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
      <Link to="../discussions" className="muted" style={{ fontSize: '0.82rem' }}>
        ← All discussions
      </Link>
      <h2 style={{ margin: '0.5rem 0 0.25rem' }}>💬 {topic.title}</h2>

      <div className="card" style={{ margin: '0.75rem 0 1.25rem' }}>
        <div className="inline" style={{ gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="avatar">{author?.name.charAt(0) ?? '?'}</span>
          <strong>{author?.name}</strong>
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
                <span className="avatar">{who?.name.charAt(0) ?? '?'}</span>
                <strong>{who?.name.replace(/ \(Student\)$/, '')}</strong>
                {who?.role === 'teacher' && <span className="chip">Teacher</span>}
                <span className="muted" style={{ fontSize: '0.75rem' }}>
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
            value={reply}
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
