import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        await browser.tabs.create({ url: "src/options.html#onboarding" });
    } else if (details.reason === "update") {
        await browser.action.setBadgeText({ text: "Novo" });
        await browser.action.setBadgeBackgroundColor({ color: "#6366f1" });
        await browser.storage.local.set({ hasNewUpdate: true });
        await browser.tabs.create({ url: "src/options.html#whats-new" });
    }
});

browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'open_options') {
        browser.runtime.openOptionsPage();
    }
});