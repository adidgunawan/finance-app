import { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import { FiBarChart2, FiRepeat, FiUsers, FiLogOut, FiFileText, FiRefreshCw, FiCreditCard, FiHome, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/home', label: 'Dashboard', icon: FiHome },
  { path: '/chart-of-accounts', label: 'Chart of Accounts', icon: FiBarChart2 },
  { path: '/transactions', label: 'Transactions', icon: FiRepeat },
  { path: '/contacts', label: 'Contacts', icon: FiUsers },
  { path: '/reports', label: 'Reports', icon: FiFileText },
  { path: '/reconciliation', label: 'Reconciliation', icon: FiRefreshCw },
  { path: '/banks', label: 'Banks', icon: FiCreditCard },
];

export function Nav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set dropdown left position to 10px
  useEffect(() => {
    const updateDropdownPosition = () => {
      // Find the Radix UI portal wrapper that contains our dropdown
      const wrapper = document.querySelector('[data-radix-popper-content-wrapper]') as HTMLElement;
      if (wrapper && wrapper.querySelector('.account-dropdown')) {
        wrapper.style.left = '10px';
      }
    };

    // Use MutationObserver to watch for dropdown appearance
    const observer = new MutationObserver(updateDropdownPosition);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    // Also check immediately and on a short interval
    updateDropdownPosition();
    const interval = setInterval(updateDropdownPosition, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className="nav">
        <div className="mb-6 pb-4 border-b border-border">
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline text-foreground"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
              <img
                src="/logo.png"
                alt="Jenjun Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold tracking-tight">
                Jenjun
              </span>
              <span className="text-xs font-normal text-muted-foreground tracking-wide">
                Finance App
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Search */}
        <div className="mb-6 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search... (Cmd+K)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background pl-9"
            />
          </div>
        </div>

        <div>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/home' && location.pathname === '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "nav-item flex items-center",
                  isActive && 'active'
                )}
              >
                <IconComponent className="mr-2 text-base" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto pt-3 border-t border-border relative z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="nav-item w-full text-left bg-transparent border-none cursor-pointer p-1.5 text-foreground text-sm flex items-center gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {user?.image && (
                    <AvatarImage 
                      src={user.image} 
                      alt={getUserDisplayName()} 
                      className="object-cover w-full h-full" 
                    />
                  )}
                  <AvatarFallback className="bg-accent text-white text-xs font-semibold w-full h-full">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                    {getUserDisplayName()}
                  </div>
                  {user?.email && (
                    <div className="text-[11px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                      {user.email}
                    </div>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="top"
              className="w-64 z-[200] p-0 account-dropdown"
              sideOffset={8}
            >
              {/* Profile Section */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {user?.image && (
                      <AvatarImage 
                        src={user.image} 
                        alt={getUserDisplayName()} 
                        className="object-cover w-full h-full" 
                      />
                    )}
                    <AvatarFallback className="bg-accent text-white text-sm font-semibold w-full h-full">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">
                      {getUserDisplayName()}
                    </div>
                    {user?.email && (
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <DropdownMenuItem className="cursor-pointer !pl-5 !pr-4">
                  <FiSettings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer !pl-5 !pr-4">
                  <FiHelpCircle className="mr-2 h-4 w-4" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-foreground focus:bg-muted !pl-5 !pr-4"
                >
                  <FiLogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
