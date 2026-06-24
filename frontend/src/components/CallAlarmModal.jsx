import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper, X } from 'lucide-react';
import { getSocket } from '../hooks/useQueueSocket';
import { useAuth } from '../context/AuthContext';
import { playCallAlert } from '../utils/sound';

const ORIGINAL_TITLE = 'ClinicFlow — Live Queue Manager';
const FLASH_TITLE = "🔔 It's your turn!";

// Full-screen takeover shown to a patient the moment their token is called.
// Mounted once, globally, inside AppShell — so it fires no matter which
// page the patient is currently looking at.
export default function CallAlarmModal() {
  const { token, user } = useAuth() || {};
  const [alarm, setAlarm] = useState(null); // { tokenNumber } | null
  const flashTimer = useRef(null);
  const repeatTimer = useRef(null);

  const isPatient = user?.role === 'patient';

  useEffect(() => {
    if (!isPatient) return;
    const socket = getSocket(token);

    const handler = (n) => {
      if (n.title !== 'You are being called!') return;
      // Only react if this is actually our token (the server already scopes
      // this event to our room, but double-check client-side too)
      if (user?.linkedTokenNumber && n.tokenNumber && Number(n.tokenNumber) !== Number(user.linkedTokenNumber)) return;

      setAlarm({ tokenNumber: n.tokenNumber || user?.linkedTokenNumber });
      playCallAlert();
      if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]);

      // Flash the browser tab title so it's noticeable even if the tab isn't focused
      let on = true;
      flashTimer.current = setInterval(() => {
        document.title = on ? FLASH_TITLE : ORIGINAL_TITLE;
        on = !on;
      }, 900);

      // Re-play the alert sound every few seconds until dismissed, in case
      // the patient stepped away from the device
      repeatTimer.current = setInterval(() => {
        playCallAlert();
        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
      }, 8000);
    };

    socket.on('notify', handler);
    return () => {
      socket.off('notify', handler);
      clearInterval(flashTimer.current);
      clearInterval(repeatTimer.current);
      document.title = ORIGINAL_TITLE;
    };
  }, [token, user?.linkedTokenNumber, isPatient]);

  function dismiss() {
    setAlarm(null);
    clearInterval(flashTimer.current);
    clearInterval(repeatTimer.current);
    document.title = ORIGINAL_TITLE;
  }

  return (
    <AnimatePresence>
      {alarm && (
        <motion.div className="alarm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="alarm-card" initial={{ scale: .85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .9, opacity: 0 }}>
            <div className="alarm-card__icon"><PartyPopper size={32} /></div>
            <div className="alarm-card__title">It's your turn!</div>
            <div className="alarm-card__token">#{alarm.tokenNumber}</div>
            <div className="alarm-card__sub">Please proceed to the consultation room now.</div>
            <button className="btn btn--primary" style={{ width: '100%' }} onClick={dismiss}>
              <X size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Got it, dismiss
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
