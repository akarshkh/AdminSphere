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
        <div className="min-h-screen bg-[#050505] text-white">
            <Header
                toggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
                username={username}
                isAuthenticated={true}
                showSidebarToggle={true}
            />

            <div className="flex pt-20 min-h-screen">
                {/* Sidebar */}
                <motion.aside
                    initial={{ width: 280 }}
                    animate={{ width: isSidebarOpen ? 280 : 80 }}
                    className="fixed left-0 top-20 bottom-0 bg-black/50 backdrop-blur-2xl border-r border-white/10 flex flex-col z-40 transition-all duration-300 shadow-2xl"
                >
                    <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
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

                    <div className="p-4 border-t border-white/5">
                        <motion.button
                            onClick={handleLogout}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl text-white group border border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-600 hover:to-orange-600 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300 ${!isSidebarOpen && 'justify-center'}`}
                        >
                            <LogOut className="w-5 h-5 relative z-10 text-red-400 group-hover:text-white transition-colors group-hover:-translate-x-1" />
                            {isSidebarOpen && <span className="font-semibold relative z-10 text-red-100 group-hover:text-white">Sign Out</span>}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </motion.button>
                    </div>
                </motion.aside>

                {/* Main Content */}
                <div
                    className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}
                >
                    <main className="p-8 md:p-12 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon: Icon, label, active, isOpen, onClick, color = 'blue' }) => {
    const activeColors = {
        blue: 'bg-blue-500/15 text-blue-400 border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]',
        indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/50 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]',
        cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.3)]',
        orange: 'bg-orange-500/15 text-orange-400 border-orange-500/50 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]',
    };

    const activeStyle = activeColors[color] || activeColors.blue;
    const iconColor = active ? activeStyle.split(' ')[1] : 'text-gray-500 group-hover:text-gray-300';

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`
            flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-300 group relative border
            ${active ? `${activeStyle}` : 'border-transparent hover:bg-white/5 hover:border-white/5'}
            ${!isOpen && 'justify-center'}
        `}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${iconColor}`} />
            {isOpen && (
                <span className={`font-semibold text-sm transition-colors duration-300 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {label}
                </span>
            )}
        </motion.div>
    );
};

export default ServiceLayout;
