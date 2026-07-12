import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import * as repo from '../lib/repository';

/** Canvas-style Inbox: conversation list on the left, thread on the right. */
export default function Inbox() {
  const { currentUser, profiles, conversations, messages, profileById, refresh } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const myConversations = useMemo(
    () =>
      conversations
        .filter((c) => c.participant_ids.includes(currentUser?.id ?? ''))
        .map((c) => ({
          conv: c,
          last: messages
            .filter((m) => m.conversation_id === c.id)
            .sort((a, b) => b.created_at.localeCompare(a.created_at))[0],
        }))
        .sort((a, b) =>
          (b.last?.created_at ?? b.conv.created_at).localeCompare(
            a.last?.created_at ?? a.conv.created_at,
          ),
        ),
    [conversations, messages, currentUser],
  );

  if (!currentUser) return <div className="empty">Select a user to begin.</div>;

  const selected = myConversations.find((c) => c.conv.id === selectedId)?.conv ?? null;
  const thread = selected
    ? messages
        .filter((m) => m.conversation_id === selected.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    : [];

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    try {
      await repo.createMessage({
        conversation_id: selected.id,
        sender_id: currentUser.id,
        body: reply.trim(),
      });
      setReply('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Inbox</h1>
        <p>Messages between you, your teachers and classmates.</p>
      </div>

      <div className="toolbar">
        <span className="muted">
          {myConversations.length} conversation{myConversations.length === 1 ? '' : 's'}
        </span>
        <button className="btn small" onClick={() => setComposing((v) => !v)}>
          {composing ? 'Cancel' : '✉️ Compose'}
        </button>
      </div>

      {composing && (
        <ComposeForm
          senderId={currentUser.id}
          recipients={profiles.filter((p) => p.id !== currentUser.id && p.role !== 'admin')}
          onSent={async (id) => {
            setComposing(false);
            setSelectedId(id);
            await refresh();
          }}
        />
      )}

      <div className="inbox-layout">
        <div className="inbox-list">
          {myConversations.length === 0 ? (
            <div className="empty">No messages yet.</div>
          ) : (
            myConversations.map(({ conv, last }) => {
              const others = conv.participant_ids
                .filter((id) => id !== currentUser.id)
                .map((id) => profileById(id)?.name ?? '?')
                .join(', ');
              return (
                <button
                  key={conv.id}
                  className={`inbox-row ${selectedId === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(conv.id)}
                >
                  <strong>{others}</strong>
                  <span className="inbox-subject">{conv.subject}</span>
                  {last && <span className="inbox-preview">{last.body.slice(0, 60)}</span>}
                </button>
              );
            })
          )}
        </div>

        <div className="inbox-thread">
          {!selected ? (
            <div className="empty">Select a conversation.</div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>{selected.subject}</h2>
              <div className="stack" style={{ gap: '0.6rem' }}>
                {thread.map((m) => {
                  const mine = m.sender_id === currentUser.id;
                  return (
                    <div key={m.id} className={`message-bubble ${mine ? 'mine' : ''}`}>
                      <div className="message-meta">
                        {profileById(m.sender_id)?.name} ·{' '}
                        {new Date(m.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      {m.body}
                    </div>
                  );
                })}
              </div>
              <div className="field" style={{ marginTop: '1rem' }}>
                <textarea
                  value={reply}
                  placeholder="Write a reply…"
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>
              <div className="row-between">
                <span />
                <button className="btn small" disabled={!reply.trim() || busy} onClick={sendReply}>
                  {busy ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ComposeForm({
  senderId,
  recipients,
  onSent,
}: {
  senderId: string;
  recipients: { id: string; name: string }[];
  onSent: (conversationId: string) => Promise<void>;
}) {
  const [to, setTo] = useState(recipients[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!to || !subject.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const conv = await repo.createConversation({
        subject: subject.trim(),
        participant_ids: [senderId, to],
      });
      await repo.createMessage({
        conversation_id: conv.id,
        sender_id: senderId,
        body: body.trim(),
      });
      await onSent(conv.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="inline" style={{ gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '0 0 220px' }}>
          <label>To</label>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 240px' }}>
          <label>Subject</label>
          <input value={subject} placeholder="Subject" onChange={(e) => setSubject(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="row-between">
        <span />
        <button
          className="btn small"
          disabled={!subject.trim() || !body.trim() || busy}
          onClick={send}
        >
          {busy ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </div>
  );
}
