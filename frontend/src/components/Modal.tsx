import { useEffect, type PropsWithChildren } from 'react';
import { Button } from './Button';

interface ModalProps extends PropsWithChildren { open: boolean; title: string; onClose: () => void; onConfirm: () => void; busy?: boolean }

export function Modal({ open, title, onClose, onConfirm, busy = false, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, busy, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal__icon" aria-hidden="true">!</div><h2 id="modal-title">{title}</h2><div className="modal__body">{children}</div>
      <div className="modal__actions"><Button disabled={busy} onClick={onClose}>Cancel</Button><Button variant="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete task'}</Button></div>
    </section>
  </div>;
}
