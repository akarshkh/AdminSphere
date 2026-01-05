import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Smartphone, Lock, LogOut, LayoutDashboard, Menu, Search, Bell, Settings as SettingsIcon, BarChart3, Command
} from 'lucide-react';
import SearchModal from './SearchModal';

const ServiceLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const username = localStorage.getItem('m365_user') || 'Admin';

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Keyboard shortcut for search (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('m365_user');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar" style={{ width: isSidebarOpen ? 'var(--sidebar-width)' : '80px' }}>
                <div className="sidebar-header">
                    <div className="flex-center" style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--glass-bg)',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '4px',
                        padding: '6px'
                    }}>
                        <div style={{ backgroundColor: '#f25022', borderRadius: '1px' }}></div>
                        <div style={{ backgroundColor: '#7fba00', borderRadius: '1px' }}></div>
                        <div style={{ backgroundColor: '#00a4ef', borderRadius: '1px' }}></div>
                        <div style={{ backgroundColor: '#ffb900', borderRadius: '1px' }}></div>
                    </div>
                    {isSidebarOpen && <span className="font-bold" style={{ fontSize: '18px' }}>M365 Portal</span>}
                </div>

                <nav className="sidebar-nav">
                    <NavItem
                        icon={BarChart3}
                        label="Overview"
                        active={isActive('/service/overview')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/overview')}
                    />
                    <NavItem
                        icon={LayoutDashboard}
                        label="Admin Center"
                        active={isActive('/service/admin')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/admin')}
                    />
                    <NavItem
                        icon={ShieldCheck}
                        label="Entra ID"
                        active={isActive('/service/entra')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/entra')}
                    />
                    <NavItem
                        icon={Smartphone}
                        label="Intune"
                        active={isActive('/service/intune')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/intune')}
                    />
                    <NavItem
                        icon={Lock}
                        label="Purview"
                        active={isActive('/service/purview')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/purview')}
                    />
                </nav>

                <div style={{ padding: '24px', borderTop: '1px solid hsla(0,0%,100%,0.05)' }}>
                    <button className="btn-secondary w-full" onClick={handleLogout} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: '12px' }}>
                        <LogOut size={18} />
                        {isSidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <main className="app-main" style={{ marginLeft: isSidebarOpen ? 'var(--sidebar-width)' : '80px' }}>
                <header className="header-top">
                    <div className="flex-center flex-gap-4">
                        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <Menu size={20} />
                        </button>

                        {/* Clickable Search Button */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex-center"
                            style={{
                                background: 'var(--glass-bg)',
                                padding: '8px 16px',
                                borderRadius: '100px',
                                border: '1px solid var(--glass-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flex: '1',
                                maxWidth: '280px',
                                justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'hsla(0,0%,100%,0.08)';
                                e.currentTarget.style.borderColor = 'hsla(0,0%,100%,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--glass-bg)';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}
                        >
                            <div className="flex-center" style={{ gap: '10px' }}>
                                <Search size={16} color="var(--text-dim)" />
                                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Search...</span>
                            </div>
                            <div className="flex-center" style={{ gap: '4px', fontSize: '10px', color: 'var(--text-dim)', opacity: 0.6 }}>
                                <Command size={10} />
                                <span>K</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex-center flex-gap-4">
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><Bell size={20} /></button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><SettingsIcon size={20} /></button>
                        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }}></div>
                        <div className="flex-center flex-gap-2">
                            <div style={{ textAlign: 'right' }}>
                                <div className="font-semibold" style={{ fontSize: '13px' }}>{username}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Global Admin</div>
                            </div>
                            <div className="avatar" style={{
                                width: '36px',
                                height: '36px',
                                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '12px',
                                border: '2px solid var(--glass-border)'
                            }}>
                                {username.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="main-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
};

const NavItem = ({ icon: Icon, label, active, isOpen, onClick }) => (
    <div
        onClick={onClick}
        className={`nav-item ${active ? 'active' : ''}`}
        style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
    >
        <Icon size={20} style={{ flexShrink: 0 }} />
        {isOpen && <span>{label}</span>}
    </div>
);

export default ServiceLayout;
