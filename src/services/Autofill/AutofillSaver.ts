import browser from 'webextension-polyfill';
import { FormField, UrlPattern } from '../../utils/helper';

export class AutofillSaver {
    private static PATTERNS_KEY = '__url_patterns__';
    private static PROFILES_KEY = '__profiles__';
    private static SITE_DATA_KEY = '__site_data__';

    public static normalizeUrl(url: string): string {
        try {
            const parsed = new URL(url);
            // Remove hash and trailing slash for matching
            return (parsed.origin + parsed.pathname).replace(/\/$/, '');
        } catch {
            return url.replace(/\/$/, '');
        }
    }

    public static async getProfiles(): Promise<string[]> {
        const data = await browser.storage.local.get(this.PROFILES_KEY);
        const profiles = data[this.PROFILES_KEY] as string[];
        if (!profiles || profiles.length === 0) {
            const defaultProfiles = ['Padrão'];
            await this.saveProfiles(defaultProfiles);
            return defaultProfiles;
        }
        return profiles;
    }

    public static async saveProfiles(profiles: string[]): Promise<void> {
        await browser.storage.local.set({ [this.PROFILES_KEY]: profiles });
    }

    public static async addProfile(name: string): Promise<void> {
        const profiles = await this.getProfiles();
        if (!profiles.includes(name)) {
            profiles.push(name);
            await this.saveProfiles(profiles);
        }
    }

    public static async getFieldsForUrl(url: string, profile: string = 'Padrão'): Promise<FormField[]> {
        await this.runMigration();
        const normalized = this.normalizeUrl(url);
        
        const data = await browser.storage.local.get(this.SITE_DATA_KEY);
        const siteData = data[this.SITE_DATA_KEY] as Record<string, Record<string, FormField[]>> || {};
        
        // Try normalized, then original as fallback
        if (siteData[normalized] && siteData[normalized][profile]) {
            return siteData[normalized][profile];
        }
        if (siteData[url] && siteData[url][profile]) {
            return siteData[url][profile];
        }

        return [];
    }

    public static async saveFieldsForUrl(url: string, fields: FormField[], profile: string = 'Padrão'): Promise<void> {
        await this.runMigration();
        const normalized = this.normalizeUrl(url);
        
        const data = await browser.storage.local.get(this.SITE_DATA_KEY);
        const siteData = data[this.SITE_DATA_KEY] as Record<string, Record<string, FormField[]>> || {};
        
        if (!siteData[normalized]) siteData[normalized] = {};
        siteData[normalized][profile] = fields;
        
        await browser.storage.local.set({ [this.SITE_DATA_KEY]: siteData });
    }

    public static async getAllSiteData(): Promise<Record<string, Record<string, FormField[]>>> {
        await this.runMigration();
        const data = await browser.storage.local.get(this.SITE_DATA_KEY);
        return data[this.SITE_DATA_KEY] as Record<string, Record<string, FormField[]>> || {};
    }

    public static async deleteSiteData(url: string, profile?: string): Promise<void> {
        const normalized = this.normalizeUrl(url);
        const data = await browser.storage.local.get(this.SITE_DATA_KEY);
        const siteData = data[this.SITE_DATA_KEY] as Record<string, Record<string, FormField[]>> || {};
        
        if (siteData[normalized]) {
            if (profile) {
                delete siteData[normalized][profile];
                if (Object.keys(siteData[normalized]).length === 0) delete siteData[normalized];
            } else {
                delete siteData[normalized];
            }
            await browser.storage.local.set({ [this.SITE_DATA_KEY]: siteData });
        }
    }

    public static async getAllUrlPatterns(): Promise<UrlPattern[]> {
        const data = await browser.storage.local.get(this.PATTERNS_KEY);
        const patternsData = data[this.PATTERNS_KEY] as Record<string, UrlPattern> || {};
        return Object.values(patternsData);
    }

    public static async saveUrlPattern(pattern: string, fields: FormField[], enabled: boolean = true): Promise<void> {
        const data = await browser.storage.local.get(this.PATTERNS_KEY);
        const patternsData = data[this.PATTERNS_KEY] as Record<string, UrlPattern> || {};
        
        patternsData[pattern] = { pattern, enabled, fields };
        await browser.storage.local.set({ [this.PATTERNS_KEY]: patternsData });
    }

    public static async deleteUrlPattern(pattern: string): Promise<void> {
        const data = await browser.storage.local.get(this.PATTERNS_KEY);
        const patternsData = data[this.PATTERNS_KEY] as Record<string, UrlPattern> || {};
        
        delete patternsData[pattern];
        await browser.storage.local.set({ [this.PATTERNS_KEY]: patternsData });
    }

    public static async getSettings(): Promise<any> {
        return await browser.storage.local.get(['enabled', 'barBehavior', 'blacklistedSites', 'isBarOpen', 'currentProfile', 'isFloatingEnabled']);
    }

    public static async saveSettings(settings: any): Promise<void> {
        await browser.storage.local.set(settings);
    }

    private static async runMigration(): Promise<void> {
        const data = await browser.storage.local.get(null);
        let siteData = data[this.SITE_DATA_KEY] as any || {};
        let migrated = false;

        // 1. Move root-level URLs (Legacy) to __site_data__
        const specialKeys = [this.PATTERNS_KEY, this.PROFILES_KEY, this.SITE_DATA_KEY, 'enabled', 'barBehavior', 'blacklistedSites', 'isBarOpen', 'currentProfile', 'hasNewUpdate', 'lastSync'];
        const keysToRemove: string[] = [];

        for (const key of Object.keys(data)) {
            if (!specialKeys.includes(key) && (key.startsWith('http') || key.startsWith('file'))) {
                const normalized = this.normalizeUrl(key);
                if (!siteData[normalized]) siteData[normalized] = {};
                // Handle legacy data (usually an array of fields)
                siteData[normalized]['Padrão'] = data[key];
                keysToRemove.push(key);
                migrated = true;
            }
        }

        // 2. Convert old __site_data__ entries (arrays) to profile-keyed objects
        for (const url of Object.keys(siteData)) {
            if (Array.isArray(siteData[url])) {
                const fields = siteData[url];
                siteData[url] = { 'Padrão': fields };
                migrated = true;
            }
        }

        if (migrated) {
            console.log('[AutoFill] Migrando dados antigos para a nova estrutura de Perfis...');
            await browser.storage.local.set({ [this.SITE_DATA_KEY]: siteData });
            if (keysToRemove.length > 0) {
                await browser.storage.local.remove(keysToRemove);
            }
        }
    }

    public static async exportAllData(): Promise<string> {
        const data = await browser.storage.local.get(null);
        const backup = {
            ...data,
            __backup_metadata__: {
                version: 1,
                timestamp: new Date().toISOString(),
                key: 'autofill-pro-backup-key-safe'
            }
        };
        return JSON.stringify(backup, null, 2);
    }

    public static async importAllData(jsonString: string): Promise<{ success: boolean; message: string }> {
        try {
            const data = JSON.parse(jsonString);
            if (!data.__backup_metadata__ || data.__backup_metadata__.key !== 'autofill-pro-backup-key-safe') {
                return { success: false, message: 'Arquivo de backup inválido ou chave incorreta!' };
            }

            // Remove metadata before restoring
            const { __backup_metadata__, ...rest } = data;
            
            await browser.storage.local.clear();
            await browser.storage.local.set(rest);
            
            return { success: true, message: 'Dados importados com sucesso!' };
        } catch (e) {
            return { success: false, message: 'Erro ao processar o arquivo JSON!' };
        }
    }
}
