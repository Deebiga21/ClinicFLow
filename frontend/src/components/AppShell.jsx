import Sidebar from './Sidebar';
import NotificationStack from './NotificationStack';
import CallAlarmModal from './CallAlarmModal';
import Ferrofluid from './Ferrofluid';

export default function AppShell({ children }) {
  return (
    <div className="shell">
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
        <Ferrofluid
          colors={["#ffffff","#ffffff","#ffffff"]}
          speed={0.5}
          scale={1}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={3}
          shimmer={1}
          glow={2}
          flowDirection="down"
          opacity={1}
          mouseInteraction={true}
          mouseStrength={1}
          mouseRadius={0.3}
        />
      </div>
      <Sidebar />
      <main className="shell__main">{children}</main>
      <NotificationStack />
      <CallAlarmModal />
    </div>
  );
}
