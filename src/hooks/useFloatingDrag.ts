import { useEffect, useState, useRef } from 'react';
import browser from 'webextension-polyfill';

export const useFloatingDrag = (isBarOpen: boolean) => {
    const [floatingPos, setFloatingPos] = useState({
        x: window.innerWidth - 68,
        y: 80
    });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const lastWindowSize = useRef({ w: window.innerWidth, h: window.innerHeight });
    const [originalPreOpenPos, setOriginalPreOpenPos] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const loadPos = async () => {
            const data = await browser.storage.local.get('floating_pos');
            if (data.floating_pos) setFloatingPos(data.floating_pos);
        };
        loadPos();

        const handleResize = () => {
            setFloatingPos(prev => {
                const newW = window.innerWidth;
                const newH = window.innerHeight;
                const oldW = lastWindowSize.current.w;
                const oldH = lastWindowSize.current.h;

                const deltaW = newW - oldW;
                const deltaH = newH - oldH;

                let newX = prev.x;
                let newY = prev.y;

                if (prev.x > oldW / 2) newX = prev.x + deltaW;
                if (prev.y > oldH / 2) newY = prev.y + deltaH;

                const maxX = newW - 60;
                const maxY = newH - 72;
                newX = Math.max(0, Math.min(maxX, newX));
                newY = Math.max(0, Math.min(maxY, newY));

                lastWindowSize.current = { w: newW, h: newH };
                return { x: newX, y: newY };
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isBarOpen) return;
        isDraggingRef.current = false;
        dragStartRef.current = { x: e.clientX - floatingPos.x, y: e.clientY - floatingPos.y };

        const handleMouseMove = (mv: MouseEvent) => {
            const maxX = window.innerWidth - 32;
            const maxY = window.innerHeight - 32;
            const newX = Math.max(0, Math.min(maxX, mv.clientX - dragStartRef.current.x));
            const newY = Math.max(0, Math.min(maxY, mv.clientY - dragStartRef.current.y));

            if (!isDraggingRef.current && (
                Math.abs(mv.clientX - (dragStartRef.current.x + floatingPos.x)) > 5 ||
                Math.abs(mv.clientY - (dragStartRef.current.y + floatingPos.y)) > 5
            )) {
                isDraggingRef.current = true;
            }

            setFloatingPos({ x: newX, y: newY });
        };

        const handleMouseUp = (up: MouseEvent) => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            if (isDraggingRef.current) {
                const maxX = window.innerWidth - 32;
                const maxY = window.innerHeight - 32;
                const finalX = Math.max(0, Math.min(maxX, up.clientX - dragStartRef.current.x));
                const finalY = Math.max(0, Math.min(maxY, up.clientY - dragStartRef.current.y));
                browser.storage.local.set({ floating_pos: { x: finalX, y: finalY } }).catch(() => {});
                setOriginalPreOpenPos(null);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const toggleOpenWithShift = (isOpen: boolean) => {
        if (isOpen) {
            const PADDING = 100;
            const newX = Math.max(PADDING, Math.min(window.innerWidth - PADDING, floatingPos.x));
            const newY = Math.max(PADDING, Math.min(window.innerHeight - PADDING, floatingPos.y));

            if (newX !== floatingPos.x || newY !== floatingPos.y) {
                setOriginalPreOpenPos(floatingPos);
                setFloatingPos({ x: newX, y: newY });
                browser.storage.local.set({ floating_pos: { x: newX, y: newY } }).catch(() => {});
            } else {
                setOriginalPreOpenPos(null);
            }
        } else {
            if (originalPreOpenPos) {
                setFloatingPos(originalPreOpenPos);
                browser.storage.local.set({ floating_pos: originalPreOpenPos }).catch(() => {});
                setOriginalPreOpenPos(null);
            }
        }
    };

    return {
        floatingPos,
        handleMouseDown,
        isDragging: isDraggingRef,
        toggleOpenWithShift
    };
};
