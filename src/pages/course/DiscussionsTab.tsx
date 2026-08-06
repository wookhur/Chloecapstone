import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import * as repo from '../../lib/repository';
import type { ClassInfo } from '../../lib/types';
import { displayName, initial } from '../../lib/names';
import Icon from '../../components/Icon';
import EmptyState from '../../components/EmptyState';

/** Discussions: topic list, or a single thread when :topicId is present. */
export default function DiscussionsTab({
  cls,
  canPost,
}: {
  cls: ClassInfo;
  canPost: boolean;
}) {
  const { topicId } = useParams<{ topicId: string }>();
  return topicId ? (
    <TopicThread cls={cls} topicId={topicId} canPost={canPost} />
  ) : (
    <TopicList cls={cls} canPost={canPost} />
  );
}

function TopicList({ cls, canPost }: { cls: ClassInfo; canPost: boolean }) {
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
      <div className="row-between mb-4">
        <h2 className="section-title">Discussions</h2>
        {canPost && (
          <button
            className={`btn small ${showForm ? 'secondary' : ''}`}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : '+ Discussion'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="field">
            <label>Topic title</label>
            <input aria-label="Topic title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
      )}

      {topics.length === 0 ? (
        <EmptyState icon="discussions" title="No discussions yet">
          <p>
            {canPost
              ? 'Start one with a question about the homework — someone else almost certainly has the same one.'
              : 'Anyone in the class can start a topic. Nothing has been posted yet.'}
          </p>
        </EmptyState>
      ) : (
        <ul className="plain-list boxed">
          {topics.map((t) => {
            const replies = discussionPosts.filter((p) => p.topic_id === t.id).length;
            return (
              <li key={t.id} className="list-row">
                <div>
                  <Link to={`../discussions/${t.id}`} className="semibold">
                    {t.title}
                  </Link>
                  <div className="meta mt-1">
                    {displayName(profileById(t.author_id))} ·{' '}
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

function TopicThread({
  cls,
  topicId,
  canPost,
}: {
  cls: ClassInfo;
  topicId: string;
  canPost: boolean;
}) {
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
      <Link to="../discussions" className="meta">
        <Icon name="chevron-left" size="0.9em" /> All discussions
      </Link>
      <h2 className="detail-head">{topic.title}</h2>

      <div className="card detail-sub">
        <div className="inline gap-2 mb-1">
          <span className="avatar">{initial(author)}</span>
          <strong>{displayName(author)}</strong>
          {author?.role === 'teacher' && <span className="chip">Teacher</span>}
        </div>
        <p className="post-body">{topic.body}</p>
      </div>

      <h3 className="text-sm mb-2">
        {posts.length} repl{posts.length === 1 ? 'y' : 'ies'}
      </h3>
      <div className="stack gap-2">
        {posts.map((p) => {
          const who = profileById(p.author_id);
          return (
            <div key={p.id} className="card subtle discussion-post">
              <div className="inline gap-2 mb-1">
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
              <p className="post-body">{p.body}</p>
            </div>
          );
        })}
      </div>

      {canPost ? (
        <div className="card mt-4">
          <div className="field">
            <label htmlFor={`reply-${topic.id}`}>Reply</label>
            <textarea
              id={`reply-${topic.id}`}
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
      ) : (
        <p className="meta mt-4">
          You're reading this course as a visitor — join the course to reply.
        </p>
      )}
    </div>
  );
}
