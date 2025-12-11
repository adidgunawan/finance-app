import { Nav } from './Nav';
import { MobileHeader } from './MobileHeader';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <MobileHeader />
      <Nav />
      <main className="main-content" style={{ width: '100%' }}>{children}</main>
    </div>
  );
}

