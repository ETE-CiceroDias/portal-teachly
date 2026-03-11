// components/ConfirmModal.jsx — substitui confirm() do browser
import { useEffect } from 'react';
import { Trash, Question } from '@phosphor-icons/react';

export function ConfirmModal({ title, message, confirmLabel = 'Confirmar', danger = true, onConfirm, onCancel }) {
  // Fechar com Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 28px 20px',
          maxWidth: 380,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          animation: 'modal-pop 0.15s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Ícone */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', marginBottom: 16,
        }}>
          {danger ? <Trash size={22} /> : <Question size={22} />}
        </div>

        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)', marginBottom: 8 }}>
          {title}
        </div>
        {message && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text3)', lineHeight: 1.6, marginBottom: 20 }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '8px 18px',
              color: 'var(--text2)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              background: danger ? 'rgba(239,68,68,0.85)' : 'var(--accent)',
              border: 'none', borderRadius: 10, padding: '8px 18px',
              color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}