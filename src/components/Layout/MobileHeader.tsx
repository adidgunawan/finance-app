import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import { useSearch } from '../../contexts/SearchContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';

export function MobileHeader() {
    const { searchTerm, setSearchTerm } = useSearch();
    const { user, logout } = useAuth();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Clear search on route change
    useEffect(() => {
        setSearchTerm('');
    }, [location.pathname, setSearchTerm]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getUserInitials = () => {
        if (!user) return 'U';
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="mobile-header">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <div
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src="/logo.png"
                        alt="Jenjun Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                </span>
            </Link>

            <div style={{ flex: 1, margin: '0 10px', position: 'relative' }}>
                <FiSearch
                    style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)',
                        fontSize: '13px'
                    }}
                />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '6px 8px 6px 30px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        fontSize: '13px',
                        outline: 'none',
                        height: '34px',
                        transition: 'all 0.15s ease'
                    }}
                />
            </div>

            <div style={{ position: 'relative' }} ref={menuRef}>
                <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    {getUserInitials()}
                </div>

                {showUserMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '6px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 2000,
                            width: '140px',
                            padding: '4px'
                        }}
                    >
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px 10px',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                borderRadius: 'var(--radius-sm)',
                                transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <FiLogOut style={{ fontSize: '15px' }} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
