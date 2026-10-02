import { useNotifications } from '../hooks/useNotifications';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const { items } = useNotifications();
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Notifications</h1>
          <p className="page-header__sub">Automated in-app alerts — simulated SMS, demo-safe</p>
        </div>
      </header>
      <div className="card">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 40 }}>
            <Bell size={32} /><div style={{ marginTop: 10 }}>All caught up — alerts will appear here in real time.</div>
          </div>
        ) : items.map(n => (
          <div key={n.id} style={{ padding: 14, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600 }}>{n.title}</div>
            <div style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>{n.message}</div>
          </div>
        ))}
      </div>
    </>
  );
}
