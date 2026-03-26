import { useEffect, useState } from 'react';
import { AutofillSaver } from '../services/AutofillSaver';

export const useSiteDetection = (isLoading: boolean, currentProfile: string) => {
    const [isNewSite, setIsNewSite] = useState(false);
    const [isSavedSite, setIsSavedSite] = useState(false);

    useEffect(() => {
        const checkSite = async () => {
            if (isLoading) return;
            const fields = await AutofillSaver.getFieldsForUrl(window.location.href, currentProfile);
            if (fields.length > 0) {
                setIsSavedSite(true);
                setIsNewSite(false);
            } else {
                setIsSavedSite(false);
                const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
                if (inputs.length > 0) setIsNewSite(true);
            }
        };
        checkSite();
    }, [isLoading, currentProfile]);

    return { isNewSite, isSavedSite, setIsSavedSite, setIsNewSite };
};
