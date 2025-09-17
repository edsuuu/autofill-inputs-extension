/* eslint-disable @typescript-eslint/no-explicit-any */
import browser from 'webextension-polyfill';

export class Helper {
    constructor(automatic: boolean, windowLocationHref: string) {
        this.autoFill(windowLocationHref, automatic);
    }

    public async autoFill(windowLocationHref: string, automatic: boolean = false) {
        if (automatic) {
            const { enabled } = await browser.storage.local.get("enabled");

            if (enabled === false) {
                return;
            }
        }

        browser.storage.local.get(windowLocationHref).then((data) => {
            const value = data[windowLocationHref] || [];

            value.forEach((campo: { name?: string; id?: string; value?: string }) => {
                let selector = "";
                if (campo.name) selector += `[name="${campo.name}"]`;
                if (campo.id) {
                    const safeId = CSS.escape(campo.id);
                    selector += (selector ? ", " : "") + `#${safeId}`;
                }

                const el = document.querySelectorAll(selector) as NodeListOf<HTMLInputElement>;
                if (!el || el.length === 0) return;

                el.forEach((input) => {
                    this.setElementValue(input, (campo.value ?? "").toString().trim());
                });
            });
        });

    }

    private normalize(value: string): string {
        return String(value ?? "")
            .trim()
            .replace(/\s+/g, " ")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();
    }

    private setElementValue(el: any, value: any) {
        const tag = el.tagName;
        const type = (el.type || "").toLowerCase();

        if (tag === "SELECT") {
            this.setSelectSmart(el, value);
            return;
        }

        if (type === "checkbox") {
            el.checked = typeof value === "boolean" ? value : !!value;
        } else if (type === "radio") {
            if (el.value === String(value)) el.checked = true;
        } else {
            el.value = value ?? "";
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    private setSelectSmart(select: any, rawValue: any) {
        const wanted = String(rawValue ?? "");
        const wantedN = this.normalize(wanted);

        const tryApply = () => {
            if (!select || !select.options || select.options.length === 0) return false;
            for (const opt of select.options) {
                if (String(opt.value).trim() === wanted.trim()) {
                    opt.selected = true;
                    select.dispatchEvent(new Event("input", { bubbles: true }));
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    return true;
                }
            }

            for (const opt of select.options) {
                if (this.normalize(opt.textContent) === wantedN) {
                    opt.selected = true;
                    select.dispatchEvent(new Event("input", { bubbles: true }));
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    return true;
                }
            }
            return false;
        };

        if (tryApply()) return;

        const obs = new MutationObserver(() => {
            if (tryApply()) obs.disconnect();
        });
        obs.observe(select, { childList: true, subtree: true });

        setTimeout(() => tryApply() && obs.disconnect(), 300);
        setTimeout(() => tryApply() && obs.disconnect(), 1000);
    }

}