import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import { useSearch } from '../../contexts/SearchContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function MobileHeader() {
    const { searchTerm, setSearchTerm } = useSearch();
    const { user, logout } = useAuth();
    const location = useLocation();

    // Clear search on route change
    useEffect(() => {
        setSearchTerm('');
    }, [location.pathname, setSearchTerm]);

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
        const name = user.name || user.email?.split('@')[0] || 'User';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="mobile-header">
            <Link to="/" className="flex items-center gap-2 no-underline">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                        src="/logo.png"
                        alt="Jenjun Logo"
                        className="w-full h-full object-cover"
                    />
                </div>
            </Link>

            <div className="flex-1 mx-2.5 relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 rounded-full h-[34px] text-sm"
                />
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold cursor-pointer shadow-sm overflow-hidden p-0">
                        <Avatar className="w-full h-full">
                            {user?.image && (
                                <AvatarImage 
                                    src={user.image} 
                                    alt={user.name || user.email || 'User'} 
                                    className="object-cover w-full h-full" 
                                />
                            )}
                            <AvatarFallback className="bg-accent text-white text-xs font-semibold w-full h-full">
                                {getUserInitials()}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <FiLogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
