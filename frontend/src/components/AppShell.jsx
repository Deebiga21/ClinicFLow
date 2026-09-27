import Sidebar from './Sidebar';
import NotificationStack from './NotificationStack';
import CallAlarmModal from './CallAlarmModal';
import Ferrofluid from './Ferrofluid';

export default function AppShell({ children }) {
  return (
    <div className="shell">
      {/* Ferrofluid background removed to prevent WebGL loop and scrolling issues */}
      <Sidebar />
      <main className="shell__main">{children}</main>
      <NotificationStack />
      <CallAlarmModal />
    </div>
  );
}
