import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationStack from './NotificationStack';
import CallAlarmModal from './CallAlarmModal';

export default function GlobalLayout() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main">
        <Outlet />
      </main>
      <NotificationStack />
      <CallAlarmModal />
    </div>
  );
}
