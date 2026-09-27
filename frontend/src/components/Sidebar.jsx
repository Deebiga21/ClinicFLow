import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import {
  LayoutDashboard, MessageSquare, Bell, Clock, LogOut,
  Settings, Sun, Moon, Menu, X, ClipboardCheck, HelpCircle, Stethoscope,
  Activity, Brain, MonitorPlay, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  AlertTriangle, Zap, Users, Sparkles, Box, MessageCircle, Eye, FileText
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const close = () => setOpen(false);

  const items = [
    { to: '/command-center',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/appointments',     icon: FileText,        label: 'Appointments' },
    { to: '/desk',             icon: Activity,        label: 'Live Queue' },
    { to: '/consultation',     icon: Stethoscope,     label: 'Consultation' },
    { to: '/congestion',       icon: AlertTriangle,   label: 'Congestion' },
    { to: '/doctors',          icon: Users,           label: 'Doctors' },
    { to: '/chat',             icon: MessageCircle,   label: 'Nurse Chat' },
    { to: '/medicine-intel',   icon: Box,             label: 'Medicine Intel' },
    { to: '/med-schedule',     icon: Clock,           label: 'Med Schedule' },
    { to: '/reports',          icon: FileText,        label: 'Reports' },
    { to: '/feedback',         icon: MessageSquare,   label: 'Feedback' },
    { to: '/settings',         icon: Settings,        label: 'Settings' },
  ];

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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: isCollapsed ? 1 : 1, transition: '0.3s', textDecoration: 'none', color: 'inherit' }}>
            <Logo size={26} />
            <span style={{ display: isCollapsed ? 'none' : 'block' }}>ClinicFlow</span>
          </Link>
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

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', overflowX: 'hidden' }} className="nav-scroll-area">
          <div className="sidebar__section">
            MAIN NAVIGATION
          </div>

          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={close}
              className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={18} />
                <span>{label}</span>
              </div>
              {label === 'Consultation' && <ChevronUp size={16} style={{ color: 'var(--color-muted)' }} />}
              {label === 'Reports' && <ChevronDown size={16} style={{ color: 'var(--color-muted)' }} />}
            </NavLink>
          ))}
        </div>

        <div className="sidebar__footer">
          <button className="sidebar__item" onClick={toggle}
            style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: isCollapsed ? '12px' : '9px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span style={{ display: isCollapsed ? 'none' : 'block' }}>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
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
