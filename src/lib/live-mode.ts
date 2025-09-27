let liveModeActive = false;
let callbacks: Array<(active: boolean) => void> = [];

export function setLiveMode(active: boolean): void {
    liveModeActive = active;
    callbacks.forEach(cb => cb(active));
    console.log('[LiveMode] Live mode set to', active);
}

export function isLiveMode(): boolean {
    return liveModeActive;
}

export function onLiveModeChange(cb: (active: boolean) => void): () => void {
    callbacks.push(cb);
    return () => {
        const idx = callbacks.indexOf(cb);
        if (idx > -1) callbacks.splice(idx, 1);
    };
}

// Optional: listen to DOM event bridge from UI components
if (typeof document !== 'undefined') {
    document.addEventListener('live-mode:toggled' as any, (e: any) => {
        setLiveMode(!!e?.detail?.active);
    });
}


