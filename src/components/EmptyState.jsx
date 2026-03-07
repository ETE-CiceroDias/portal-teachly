// components/EmptyState.jsx — Estado vazio reutilizável
export function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      background: 'var(--surface)', border: '1px dashed var(--border)',
      borderRadius: 16, gap: 12,
    }}>
      <div style={{ fontSize: '2.2rem', opacity: 0.5 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9375rem' }}>{title}</div>
      {desc && <div style={{ color: 'var(--text3)', fontSize: '0.85rem', maxWidth: 320, lineHeight: 1.5 }}>{desc}</div>}
      {action && (
        <button onClick={onAction} style={{
          marginTop: 4, padding: '8px 20px', borderRadius: 99,
          border: '1px solid var(--accent)', background: 'var(--accent-faint)',
          color: 'var(--accent-light)', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
        }}>{action}</button>
      )}
    </div>
  );
}
