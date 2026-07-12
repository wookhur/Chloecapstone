import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { dueLabel } from '../../lib/dates';
import * as repo from '../../lib/repository';
import type { ClassInfo, ModuleItem } from '../../lib/types';

/** Canvas Modules: ordered units of pages, assignments and links. */
export default function ModulesTab({ cls }: { cls: ClassInfo }) {
  const { currentUser, modules, moduleItems, assignments, pages, refresh } = useApp();
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const isCourseTeacher = currentUser?.id === cls.teacher_id;
  const courseModules = modules
    .filter((m) => m.class_id === cls.id)
    .sort((a, b) => a.position - b.position);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addModule = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await repo.createModule({
        class_id: cls.id,
        name: newName.trim(),
        position: courseModules.length + 1,
      });
      setNewName('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const renderItem = (item: ModuleItem) => {
    if (item.kind === 'header') {
      return <div className="module-header-item">{item.title}</div>;
    }
    if (item.kind === 'assignment') {
      const a = assignments.find((x) => x.id === item.ref_id);
      if (!a) return null;
      return (
        <Link to={`../assignments/${a.id}`} className="module-link">
          📝 {a.title}
          <span className="muted" style={{ fontSize: '0.76rem' }}>
            {dueLabel(a.due_date)}
          </span>
        </Link>
      );
    }
    if (item.kind === 'page') {
      const p = pages.find((x) => x.id === item.ref_id);
      if (!p) return null;
      return (
        <div className="module-link" style={{ cursor: 'default' }}>
          📃 {p.title}
          <span className="muted" style={{ fontSize: '0.76rem' }}>{p.body.slice(0, 60)}…</span>
        </div>
      );
    }
    // external link
    return (
      <a href={item.url ?? '#'} target="_blank" rel="noreferrer" className="module-link">
        🔗 {item.title}
      </a>
    );
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Modules</h2>
        {isCourseTeacher && (
          <div className="inline" style={{ gap: '0.4rem' }}>
            <input
              className="select"
              value={newName}
              placeholder="New module name"
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="btn small" disabled={!newName.trim() || busy} onClick={addModule}>
              + Module
            </button>
          </div>
        )}
      </div>

      {courseModules.length === 0 ? (
        <div className="empty">No modules yet.</div>
      ) : (
        <div className="stack" style={{ gap: '0.85rem' }}>
          {courseModules.map((m) => {
            const items = moduleItems
              .filter((mi) => mi.module_id === m.id)
              .sort((a, b) => a.position - b.position);
            const isCollapsed = collapsed.has(m.id);
            return (
              <div key={m.id} className="module-block">
                <button className="module-title" onClick={() => toggle(m.id)}>
                  <span className="module-caret">{isCollapsed ? '▸' : '▾'}</span>
                  {m.name}
                  <span className="muted" style={{ fontWeight: 400, fontSize: '0.78rem' }}>
                    {items.filter((i) => i.kind !== 'header').length} items
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="module-items">
                    {items.length === 0 ? (
                      <p className="muted" style={{ padding: '0.6rem 1rem', margin: 0, fontSize: '0.85rem' }}>
                        Empty module.
                      </p>
                    ) : (
                      items.map((item) => <div key={item.id}>{renderItem(item)}</div>)
                    )}
                    {isCourseTeacher && (
                      <AddItemRow moduleId={m.id} cls={cls} nextPosition={items.length + 1} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddItemRow({
  moduleId,
  cls,
  nextPosition,
}: {
  moduleId: string;
  cls: ClassInfo;
  nextPosition: number;
}) {
  const { assignments, pages, refresh } = useApp();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'assignment' | 'page'>('assignment');
  const [refId, setRefId] = useState('');
  const [busy, setBusy] = useState(false);

  const options =
    kind === 'assignment'
      ? assignments.filter((a) => a.class_id === cls.id).map((a) => ({ id: a.id, label: a.title }))
      : pages.filter((p) => p.class_id === cls.id).map((p) => ({ id: p.id, label: p.title }));

  const add = async () => {
    if (!refId) return;
    setBusy(true);
    try {
      await repo.createModuleItem({
        module_id: moduleId,
        position: nextPosition,
        kind,
        ref_id: refId,
        title: '',
        url: null,
      });
      setOpen(false);
      setRefId('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="btn ghost small" style={{ margin: '0.4rem 0.6rem' }} onClick={() => setOpen(true)}>
        + Add item
      </button>
    );
  }

  return (
    <div className="inline" style={{ gap: '0.4rem', padding: '0.5rem 0.75rem' }}>
      <select className="select" value={kind} onChange={(e) => { setKind(e.target.value as 'assignment' | 'page'); setRefId(''); }}>
        <option value="assignment">Assignment</option>
        <option value="page">Page</option>
      </select>
      <select className="select" value={refId} onChange={(e) => setRefId(e.target.value)}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <button className="btn small" disabled={!refId || busy} onClick={add}>Add</button>
      <button className="btn secondary small" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}
