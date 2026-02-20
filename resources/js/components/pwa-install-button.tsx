'use client';

import { Download } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const MOBILE_MAX_WIDTH = 768;

function isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_MAX_WIDTH;
}

function isStandalone(): boolean {
    if (typeof window === 'undefined') return true;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return true;
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
    return false;
}

export default function PwaInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showButton, setShowButton] = useState(false);
    const [installing, setInstalling] = useState(false);

    const updateVisibility = useCallback(() => {
        const mobile = isMobile();
        const standalone = isStandalone();
        setShowButton(Boolean(deferredPrompt) && mobile && !standalone);
    }, [deferredPrompt]);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH - 1}px)`);
        const handleResize = () => updateVisibility();
        mediaQuery.addEventListener('change', handleResize);

        updateVisibility();

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            mediaQuery.removeEventListener('change', handleResize);
        };
    }, [updateVisibility]);

    useEffect(() => {
        updateVisibility();
    }, [deferredPrompt, updateVisibility]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        setInstalling(true);
        try {
            const result = await deferredPrompt.prompt();
            const outcome = result?.outcome ?? 'dismissed';
            if (outcome === 'accepted') setDeferredPrompt(null);
        } catch {
            // ignore
        } finally {
            setInstalling(false);
        }
    };

    if (!showButton) return null;

    return (
        <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
            aria-label="Install app"
        >
            <Download className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{installing ? 'Installing…' : 'Install app'}</span>
        </button>
    );
}
