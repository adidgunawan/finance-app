import { Nav } from './Nav';
import { MobileNav } from './MobileNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Nav />
      <main className="main-content" style={{ width: '100%' }}>{children}</main>
      <MobileNav />
    </div>
  );
}

