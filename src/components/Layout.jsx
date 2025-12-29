import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Smartphone, Lock, LogOut, LayoutDashboard, Menu
} from 'lucide-react';
import styles from './Layout.module.css';

const ServiceLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const username = localStorage.getItem('m365_user') || 'Admin';

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        localStorage.removeItem('m365_user');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className={styles.layoutContainer}>
            {/* Fixed Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: '#9ca3af', borderRadius: '0.5rem', transition: 'all 200ms' }}>
                        <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div className={styles.logo}>
                            <div className={styles.logoSquare} style={{ backgroundColor: '#f25022' }}></div>
                            <div className={styles.logoSquare} style={{ backgroundColor: '#7fba00' }}></div>
                            <div className={styles.logoSquare} style={{ backgroundColor: '#00a4ef' }}></div>
                            <div className={styles.logoSquare} style={{ backgroundColor: '#ffb900' }}></div>
                        </div>
                        <div className={styles.brandText}>
                            <div className={styles.brandTitle}>Microsoft 365</div>
                            <div className={styles.brandSubtitle}>Admin Center</div>
                        </div>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.userProfile}>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{username || 'Admin User'}</div>
                            <div className={styles.userRole}>Global Admin</div>
                        </div>
                        <div className={styles.avatar}>
                            {username ? username.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Fixed Sidebar */}
            <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
                <div className={styles.sidebarNav}>
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Admin Center"
                        active={isActive('/service/admin')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/admin')}
                    />
                    <SidebarItem
                        icon={ShieldCheck}
                        label="Entra ID"
                        active={isActive('/service/entra')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/entra')}
                    />
                    <SidebarItem
                        icon={Smartphone}
                        label="Intune"
                        active={isActive('/service/intune')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/intune')}
                    />
                    <SidebarItem
                        icon={Lock}
                        label="Purview"
                        active={isActive('/service/purview')}
                        isOpen={isSidebarOpen}
                        onClick={() => navigate('/service/purview')}
                    />
                </div>

                <button className={styles.signOutButton} onClick={handleLogout}>
                    <LogOut style={{ width: '1.25rem', height: '1.25rem' }} />
                    {isSidebarOpen && <span>Sign Out</span>}
                </button>
            </aside>

            {/* Main Content Area */}
            <div className={`${styles.mainContent} ${!isSidebarOpen ? styles.mainContentCollapsed : ''}`}>
                <div className={styles.contentInner}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon: Icon, label, active, isOpen, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`${styles.sidebarItem} ${active ? styles.sidebarItemActive : ''}`}
            style={{ justifyContent: !isOpen ? 'center' : 'flex-start' }}
        >
            <Icon
                className={styles.sidebarItemIcon}
                style={{
                    strokeWidth: active ? 2 : 1.5,
                    color: active ? '#60a5fa' : '#9ca3af'
                }}
            />
            {isOpen && (
                <span className={styles.sidebarItemLabel} style={{ color: active ? 'white' : '#9ca3af' }}>
                    {label}
                </span>
            )}
        </div>
    );
};

export default ServiceLayout;
