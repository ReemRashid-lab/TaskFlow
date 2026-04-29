import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, CheckSquare, Users, Bell, Settings, Menu, X, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [];

  if (user?.role === 'Admin') {
    navItems.push({ name: 'User Management', icon: Users, path: '/admin' });
    navItems.push({ name: 'Task Management', icon: CheckSquare, path: '/manager' });
  } else if (user?.role === 'Manager') {
    navItems.push({ name: 'Dashboard', icon: LayoutDashboard, path: '/manager' });
  } else if (user?.role === 'Staff') {
    navItems.push({ name: 'My Tasks', icon: CheckSquare, path: '/staff' });
  }

  const NavLinks = () => (
    <>
      <div className="text-[0.7rem] uppercase tracking-wider px-6 pt-6 pb-2 text-[#475569] font-bold">Main Navigation</div>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== `/${user?.role.toLowerCase()}` && location.pathname.startsWith(item.path));
        return (
          <button
            key={item.name}
            onClick={() => {
              navigate(item.path);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-6 py-3 text-sm transition-colors border-l-[3px] ${
              isActive 
                ? 'bg-[#1e293b] text-white border-[#3b82f6]' 
                : 'text-[#94a3b8] border-transparent hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="flex h-[100dvh] bg-background text-foreground font-sans overflow-hidden transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-6 font-extrabold text-xl tracking-tight">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#3b82f6] rounded-md"></div>
            TaskFlow
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          <NavLinks />
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-6 py-4 text-sm text-[#94a3b8] hover:bg-[#1e293b] hover:text-white mt-auto transition-colors border-t border-[#1e293b]"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-[220px] lg:w-[250px] bg-[#0f172a] text-white flex-col shrink-0 py-6 hidden md:flex">
        <div className="px-6 pb-8 font-extrabold text-xl tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-[#3b82f6] rounded-md"></div>
          TaskFlow Pro
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          <NavLinks />
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-6 py-4 text-sm text-[#94a3b8] border-l-[3px] border-transparent hover:bg-[#1e293b] hover:text-white mt-auto transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-[#64748b] hover:text-[#1e293b] p-1" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:block">
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-muted border border-border px-4 py-2 rounded-lg w-64 lg:w-80 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <NotificationCenter />
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="text-right hidden sm:block">
              <div className="font-semibold text-sm truncate max-w-[150px]">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.role}</div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-accent rounded-full border-2 border-card shadow-[0_0_0_1px_#cbd5e1] flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0">
              {user?.name.charAt(0)}
            </div>
            <button className="sm:hidden text-destructive p-1 ml-1" onClick={handleLogout} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
