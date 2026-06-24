import { useNotifications } from '../hooks/useNotifications';
import { X, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const ICONS = { success: CheckCircle2, info: Info, error: AlertTriangle };

export default function NotificationStack() {
  const { items, dismiss } = useNotifications();
  return (
    <div className="notif-stack" aria-live="polite">
      {items.map(n => {
        const Icon = ICONS[n.tone] || Info;
        return (
          <div key={n.id} className={`notif notif--${n.tone || 'info'}`}>
            <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
              <Icon size={18} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div className="notif__title">{n.title}</div>
                <div className="notif__msg">{n.message}</div>
              </div>
              <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)' }}>
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
