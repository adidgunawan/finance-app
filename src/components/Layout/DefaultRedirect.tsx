import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function DefaultRedirect() {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Redirect to home on mobile, chart of accounts on desktop
    return <Navigate to={isMobile ? "/home" : "/chart-of-accounts"} replace />;
}
