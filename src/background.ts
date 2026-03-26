import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        await browser.tabs.create({ url: "src/options.html#onboarding" });
    } else if (details.reason === "update") {
        await browser.action.setBadgeText({ text: "Novo" });
        await browser.action.setBadgeBackgroundColor({ color: "#6366f1" });
        await browser.storage.local.set({ hasNewUpdate: true });
    }
});

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'open_options') {
        browser.runtime.openOptionsPage();
    }

    if (message.action === 'GENERATE_FAKER_VALUE') {
        const { type } = message;
        const { faker } = await import('@faker-js/faker/locale/pt_BR');

        switch (type) {
            case 'name': return faker.person.fullName();
            case 'firstName': return faker.person.firstName();
            case 'lastName': return faker.person.lastName();
            case 'email': return faker.internet.email();
            case 'cep': return faker.location.zipCode();
            case 'phone': return faker.phone.number();
            case 'company': return faker.company.name();
            case 'city': return faker.location.city();
            case 'state': return faker.location.state();
            case 'cnpj': return generateCNPJ();
            case 'cpf': return generateCPF();
            default: return faker.lorem.word();
        }
    }
});

function generateCPF(): string {
    const rnd = (n: number) => Math.round(Math.random() * n);
    const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
    const n: number[] = Array(9).fill(0).map(() => rnd(9));
    let d1 = n.reduce((acc, curr, i) => acc + (10 - i) * curr, 0);
    d1 = 11 - mod(d1, 11); if (d1 >= 10) d1 = 0;
    let d2 = n.reduce((acc, curr, i) => acc + (11 - i) * curr, 0) + (2 * d1);
    d2 = 11 - mod(d2, 11); if (d2 >= 10) d2 = 0;
    return `${n.join('')}${d1}${d2}`;
}

function generateCNPJ(): string {
    const rnd = (n: number) => Math.round(Math.random() * n);
    const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
    const n: number[] = Array(8).fill(0).map(() => rnd(9));
    n.push(0, 0, 0, 1);
    let d1 = n.reduce((acc, curr, i) => acc + ([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2][i]) * curr, 0);
    d1 = 11 - mod(d1, 11); if (d1 >= 10) d1 = 0;
    let d2 = n.reduce((acc, curr, i) => acc + ([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2][i]) * curr, 0) + (2 * d1);
    d2 = 11 - mod(d2, 11); if (d2 >= 10) d2 = 0;
    return `${n.join('')}${d1}${d2}`;
}