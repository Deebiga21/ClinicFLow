import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import {
  LayoutDashboard, MessageSquare, Bell, Clock, LogOut,
  Settings, Sun, Moon, Menu, X, ClipboardCheck, Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isStaff = user?.role === 'staff';
  const close = () => setOpen(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const items = isStaff
    ? [
        { to: '/desk', icon: LayoutDashboard, label: 'Front Desk' },
        { to: '/chat',  icon: MessageSquare, label: 'Patient Chat' },
        { to: '/assistant', icon: Sparkles, label: 'Assistant' },
        { to: '/wait-times', icon: Clock, label: 'Wait Times' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
      ]
    : [
        { to: '/waiting-room', icon: LayoutDashboard, label: 'My Queue' },
        { to: '/chat',  icon: MessageSquare, label: 'Chat with Staff' },
        { to: '/assistant', icon: Sparkles, label: 'Assistant' },
        { to: '/wait-times', icon: Clock, label: 'Wait Times' },
        { to: '/checkout', icon: ClipboardCheck, label: 'Check Out' },
      ];

  return (
    <>
      <button className="sidebar__toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <Logo size={28} />
          <span>ClinicFlow</span>
        </div>

        <div className="sidebar__section">{isStaff ? 'Staff' : 'Patient'}</div>
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={close}
            className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}>
            <Icon size={18} /> <span>{label}</span>
          </NavLink>
        ))}

        <div className="sidebar__section">Account</div>
        <NavLink to="/settings" onClick={close}
          className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}>
          <Settings size={18} /> <span>Settings</span>
        </NavLink>
        <button className="sidebar__item" onClick={() => { toggle(); }} style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
        </button>

        <div className="sidebar__footer">
          <NavLink to="/settings" onClick={close} className="sidebar__user" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div className="sidebar__avatar">{(user?.displayName || user?.username || 'U')[0].toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {isStaff ? (user?.department || 'Receptionist') : (user?.linkedTokenNumber ? `Token #${user.linkedTokenNumber}` : 'Patient')}
              </div>
            </div>
          </NavLink>
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
