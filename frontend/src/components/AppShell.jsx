import Sidebar from './Sidebar';
import NotificationStack from './NotificationStack';
import CallAlarmModal from './CallAlarmModal';

export default function AppShell({ children }) {
  return (
    <div className="shell">
      <div className="bg-decor" aria-hidden="true" />
      <Sidebar />
      <main className="shell__main">{children}</main>
      <NotificationStack />
      <CallAlarmModal />
    </div>
  );
}
