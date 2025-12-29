import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({
    toggleSidebar,
    isSidebarOpen,
    username,
    isAuthenticated = false,
    showSidebarToggle = false
}) => {
    const navigate = useNavigate();

    return (
        <header className="h-20 border-b border-white/10 bg-black/50 backdrop-blur-2xl fixed top-0 left-0 w-full z-[100] px-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
                {showSidebarToggle && (
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors mr-2"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {/* Logo Section */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="grid grid-cols-2 gap-1 flex-shrink-0 p-1.5 bg-white/5 rounded-lg border border-white/10">
                        <div className="w-2.5 h-2.5 bg-[#f25022] rounded-[1px]"></div>
                        <div className="w-2.5 h-2.5 bg-[#7fba00] rounded-[1px]"></div>
                        <div className="w-2.5 h-2.5 bg-[#00a4ef] rounded-[1px]"></div>
                        <div className="w-2.5 h-2.5 bg-[#ffb900] rounded-[1px]"></div>
                    </div>
                    <div className="hidden md:flex flex-col">
                        <h1 className="text-white font-semibold text-lg leading-tight">Microsoft 365</h1>
                        <span className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">Admin Center</span>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            {isAuthenticated ? (
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="hidden sm:flex flex-col items-end">
                            <p className="text-sm font-medium text-white leading-none">{username || 'Admin User'}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Global Admin</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center font-bold text-sm text-white shadow-lg border-2 border-white/20">
                            {username ? username.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center">
                    {/* Placeholder for unauthenticated header content if needed */}
                </div>
            )}
        </header>
    );
};

export default Header;
