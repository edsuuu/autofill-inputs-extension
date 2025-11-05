import browser from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "update") {
        await browser.action.setBadgeText({ text: "Novo" });
        await browser.action.setBadgeBackgroundColor({ color: "#FF0000" });
        await browser.action.setBadgeTextColor({ color: "#FFF" });
        await browser.storage.local.set({ hasNewUpdate: true });
    }
});