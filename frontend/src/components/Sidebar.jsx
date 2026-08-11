import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import {
  LayoutDashboard, MessageSquare, Bell, Clock, LogOut,
  Settings, Sun, Moon, Menu, X, ClipboardCheck, HelpCircle, Stethoscope,
  Activity, Brain, MonitorPlay, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const close = () => setOpen(false);

  const staffItems = [
    { to: '/desk',             icon: LayoutDashboard, label: 'Front Desk' },
    { to: '/doctor-dashboard', icon: Stethoscope,     label: 'Doctor Console' },
    { to: '/doctors',          icon: Stethoscope,     label: 'Manage Doctors' },
    { to: '/treatments',       icon: Activity,        label: 'Treatments & Scans' },
    { to: '/clinical-ai',      icon: Brain,           label: 'Clinica AI' },
    { to: '/chat',             icon: MessageSquare,   label: 'Patient Chat' },
    { to: '/assistant',        icon: HelpCircle,      label: 'Clinic Assistant' },
    { to: '/public-queue',     icon: MonitorPlay,     label: 'Public TV Display' },
    { to: '/wait-times',       icon: Clock,           label: 'Wait Times' },
    { to: '/notifications',    icon: Bell,            label: 'Notifications' },
  ];

  const patientItems = [
    { to: '/waiting-room', icon: LayoutDashboard, label: 'My Queue' },
    { to: '/patient-portal', icon: Activity,      label: 'Patient Portal' },
    { to: '/treatments',   icon: Activity,        label: 'Treatments & Scans' },
    { to: '/clinical-ai',  icon: Brain,           label: 'Clinica AI' },
    { to: '/chat',         icon: MessageSquare,   label: 'Chat with Staff' },
    { to: '/assistant',    icon: HelpCircle,      label: 'Clinic Assistant' },
    { to: '/wait-times',   icon: Clock,           label: 'Wait Times' },
    { to: '/checkout',     icon: ClipboardCheck,  label: 'Check Out' },
  ];

  const items = isStaff ? staffItems : patientItems;

  return (
    <>
      <button className="sidebar__toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div onClick={close} style={{
          position: 'fixed', inset: 0, zIndex: 24,
          background: 'rgba(0,0,0,.4)'
        }} />
      )}

      <aside className={`sidebar ${open ? 'is-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar__brand" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: isCollapsed ? 1 : 1, transition: '0.3s' }}>
            <Logo size={26} />
            <span style={{ display: isCollapsed ? 'none' : 'block' }}>ClinicFlow</span>
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="btn btn--ghost" 
            style={{ 
              position: 'absolute', 
              right: isCollapsed ? '-8px' : '0', 
              padding: 4, display: 'grid', placeItems: 'center',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '50%',
              zIndex: 10
            }}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <div className="sidebar__section">
          {isStaff ? (user?.role === 'admin' ? 'Admin' : 'Staff') : 'Patient'}
        </div>

        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={close}
            className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}>
            <Icon size={18} /><span>{label}</span>
          </NavLink>
        ))}

        <div className="sidebar__section">Account</div>
        <NavLink to="/settings" onClick={close}
          className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}>
          <Settings size={18} /><span>Settings</span>
        </NavLink>
        <button className="sidebar__item" onClick={toggle}
          style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
        </button>

        <div className="sidebar__footer">
          <NavLink to="/settings" onClick={close} className="sidebar__user" style={{ textDecoration: 'none', color: 'inherit', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <div className="sidebar__avatar">
              {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0, display: isCollapsed ? 'none' : 'block' }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                {user?.displayName || user?.username}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'capitalize' }}>
                {user?.role}
                {isStaff && user?.department ? ` · ${user.department}` : ''}
                {user?.role === 'patient' && user?.linkedTokenNumber ? ` · Token #${user.linkedTokenNumber}` : ''}
              </div>
            </div>
          </NavLink>
          <button className="sidebar__logout" onClick={() => { logout(); navigate('/login'); }} style={{ padding: isCollapsed ? '12px' : '9px' }}>
            <LogOut size={16} /><span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
