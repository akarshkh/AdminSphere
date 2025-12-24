import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Smartphone, Lock,
    LogOut, LayoutDashboard
} from 'lucide-react';
import Header from './Header';

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
        <div className="app-container">
            <Header
                toggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
                username={username}
                isAuthenticated={true}
                showSidebarToggle={true}
            />

            <div className="flex" style={{ paddingTop: 'var(--header-height)' }}>
                {/* Sidebar */}
                <aside
                    className="app-sidebar"
                    style={{ width: isSidebarOpen ? 'var(--sidebar-width)' : '80px' }}
                >
                    <div className="sidebar-content">
                        <SidebarItem
                            icon={LayoutDashboard}
                            label="Admin Center"
                            active={isActive('/service/admin')}
                            isOpen={isSidebarOpen}
                            onClick={() => navigate('/service/admin')}
                            color="blue"
                        />
                        <SidebarItem
                            icon={ShieldCheck}
                            label="Entra ID"
                            active={isActive('/service/entra')}
                            isOpen={isSidebarOpen}
                            onClick={() => navigate('/service/entra')}
                            color="indigo"
                        />
                        <SidebarItem
                            icon={Smartphone}
                            label="Intune"
                            active={isActive('/service/intune')}
                            isOpen={isSidebarOpen}
                            onClick={() => navigate('/service/intune')}
                            color="cyan"
                        />
                        <SidebarItem
                            icon={Lock}
                            label="Purview"
                            active={isActive('/service/purview')}
                            isOpen={isSidebarOpen}
                            onClick={() => navigate('/service/purview')}
                            color="orange"
                        />
                    </div>

                    <div className="sidebar-footer">
                        <motion.button
                            onClick={handleLogout}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-signout"
                            style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
                        >
                            <LogOut size={20} />
                            {isSidebarOpen && <span>Sign Out</span>}
                        </motion.button>
                    </div>
                </aside>

                {/* Main Content */}
                <div
                    style={{
                        flex: 1,
                        marginLeft: isSidebarOpen ? 'var(--sidebar-width)' : '80px',
                        transition: 'margin-left 0.3s'
                    }}
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon: Icon, label, active, isOpen, onClick, color = 'blue' }) => {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`sidebar-item ${active ? `active active-${color}` : ''}`}
            style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
        >
            <Icon size={20} style={{ flexShrink: 0 }} />
            {isOpen && (
                <span>
                    {label}
                </span>
            )}
        </motion.div>
    );
};

export default ServiceLayout;
