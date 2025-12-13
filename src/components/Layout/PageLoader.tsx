import { Loader2 } from 'lucide-react';

export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
    return (
        <div
            className={`flex justify-center items-center w-full ${
                fullScreen ? 'h-screen min-h-screen' : 'h-full min-h-[200px]'
            } text-muted-foreground`}
        >
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Loading...</span>
            </div>
        </div>
    );
}
