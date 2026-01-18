import buildInfo from '@/lib/build-info.json';

export function Footer() {
    const { version, commit, buildId } = buildInfo;

    // Minimal strict display
    const shortSha = commit.substring(0, 7);
    const isVercel = buildId !== commit;

    return (
        <footer className="fixed bottom-0 w-full bg-zinc-950/80 border-t border-zinc-800 backdrop-blur-sm z-50">
            <div className="flex justify-between items-center px-4 py-1 text-[10px] text-zinc-500 font-mono">
                <div className="flex gap-4">
                    <span>v{version} ({shortSha})</span>
                    {isVercel && <span className="hidden sm:inline">bld:{buildId.substring(0, 8)}</span>}
                </div>
                <div className="flex gap-2 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                    <span>Scout Production System</span>
                </div>
            </div>
        </footer>
    );
}
