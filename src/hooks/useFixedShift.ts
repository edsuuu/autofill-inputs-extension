import { useEffect, useState } from 'react';

const BAR_HEIGHT = 50;
const MOUNT_ID = 'autofill-extension-root';

export const useFixedShift = (shouldShowOffset: boolean) => {
    const [topOffset, setTopOffset] = useState(0);

    const adjustFixedElements = (show: boolean) => {
        const envBar = document.querySelector('div.fixed.top-0.left-0.w-full.py-2') as HTMLElement;
        const envBarHeight = envBar ? envBar.offsetHeight : 0;

        if (show) setTopOffset(envBarHeight);
        else setTopOffset(0);

        const totalOffset = show ? (BAR_HEIGHT + envBarHeight) : 0;

        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.id === MOUNT_ID || htmlEl.closest(`#${MOUNT_ID}`)) return;

            if (htmlEl === envBar) return;

            const style = window.getComputedStyle(htmlEl);
            if (style.position === 'fixed') {
                const topValue = style.top;
                const isAtTop = topValue === '0px' || topValue === '0' || topValue === 'auto';

                if (show && isAtTop) {
                    if (!htmlEl.dataset.autofillShifted || htmlEl.dataset.currentOffset !== String(totalOffset)) {
                        if (!htmlEl.dataset.autofillShifted) {
                            htmlEl.dataset.originalTop = topValue;
                            htmlEl.dataset.autofillShifted = 'true';
                        }
                        htmlEl.dataset.currentOffset = String(totalOffset);
                        htmlEl.style.transition = 'top 0.2s ease-in-out, margin-top 0.2s ease-in-out';
                        htmlEl.style.top = `${totalOffset}px`;
                    }
                } else if (!show && htmlEl.dataset.autofillShifted) {
                    htmlEl.style.top = htmlEl.dataset.originalTop === 'auto' ? '' : htmlEl.dataset.originalTop || '';
                    delete htmlEl.dataset.originalTop;
                    delete htmlEl.dataset.autofillShifted;
                    delete htmlEl.dataset.currentOffset;
                }
            }
        });

        return totalOffset;
    };

    useEffect(() => {
        if (!shouldShowOffset) {
            adjustFixedElements(false);
            document.body.style.paddingTop = '';
            return;
        }

        const applyOffset = () => {
            const finalOffset = adjustFixedElements(true);
            document.body.style.paddingTop = `${finalOffset}px`;
        };

        applyOffset();
        
        const observer = new MutationObserver(() => {
            applyOffset();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            adjustFixedElements(false);
            document.body.style.paddingTop = '';
        };
    }, [shouldShowOffset]);

    return { topOffset };
};
