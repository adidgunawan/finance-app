import { Nav } from './Nav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex w-full min-h-screen">
      <Nav />
      <main className="main-content w-full">{children}</main>
    </div>
  );
}
