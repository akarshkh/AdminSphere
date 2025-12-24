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
        <header className="app-header">
            <div className="flex items-center gap-4">
                {showSidebarToggle && (
                    <button
                        onClick={toggleSidebar}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            borderRadius: '8px',
                            marginRight: '8px',
                            transition: 'background 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Logo Section */}
                <div className="logo-container" >
                    <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', padding: '6px' }}>
                        <div style={{ width: '10px', height: '10px', backgroundColor: '#f25022', borderRadius: '1px' }}></div>
                        <div style={{ width: '10px', height: '10px', backgroundColor: '#7fba00', borderRadius: '1px' }}></div>
                        <div style={{ width: '10px', height: '10px', backgroundColor: '#00a4ef', borderRadius: '1px' }}></div>
                        <div style={{ width: '10px', height: '10px', backgroundColor: '#ffb900', borderRadius: '1px' }}></div>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            {isAuthenticated ? (
                <div className="flex items-center gap-6">
                    <div className="avatar">
                        {username ? username.substring(0, 2).toUpperCase() : 'AD'}
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
