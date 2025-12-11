
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: fullScreen ? '100vh' : '100%',
                minHeight: fullScreen ? '100vh' : '200px',
                width: '100%',
                color: 'var(--text-secondary)',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="spinner" />
                <span style={{ fontSize: '14px' }}>Loading...</span>
            </div>
        </div>
    );
}
