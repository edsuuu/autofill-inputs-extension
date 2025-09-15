// (async function () {
//     const {enabled} = await chrome.storage.local.get("enabled");
//     if (enabled === false) {
//         return;
//     }

//     const url = window.location.href;

//     function norm(s) {
//         return String(s ?? "")
//             .trim()
//             .replace(/\s+/g, " ")
//             .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
//             .toUpperCase();
//     }

//     function setSelectSmart(select, rawValue) {
//         const wanted = String(rawValue ?? "");
//         const wantedN = norm(wanted);

//         const tryApply = () => {
//             if (!select || !select.options || select.options.length === 0) return false;
//             for (const opt of select.options) {
//                 if (String(opt.value).trim() === wanted.trim()) {
//                     opt.selected = true;
//                     select.dispatchEvent(new Event("input", { bubbles: true }));
//                     select.dispatchEvent(new Event("change", { bubbles: true }));
//                     return true;
//                 }
//             }

//             for (const opt of select.options) {
//                 if (norm(opt.textContent) === wantedN) {
//                     opt.selected = true;
//                     select.dispatchEvent(new Event("input", { bubbles: true }));
//                     select.dispatchEvent(new Event("change", { bubbles: true }));
//                     return true;
//                 }
//             }
//             return false;
//         };

//         if (tryApply()) return;

//         const obs = new MutationObserver(() => {
//             if (tryApply()) obs.disconnect();
//         });
//         obs.observe(select, { childList: true, subtree: true });

//         setTimeout(() => tryApply() && obs.disconnect(), 300);
//         setTimeout(() => tryApply() && obs.disconnect(), 1000);
//     }

//     function setElementValue(el, value) {
//         const tag = el.tagName;
//         const type = (el.type || "").toLowerCase();

//         if (tag === "SELECT") {
//             setSelectSmart(el, value);
//             return;
//         }
//         if (type === "checkbox") {
//             el.checked = typeof value === "boolean" ? value : !!value;
//         } else if (type === "radio") {
//             if (el.value === String(value)) el.checked = true;
//         } else {
//             el.value = value ?? "";
//             el.dispatchEvent(new Event("input", { bubbles: true }));
//             el.dispatchEvent(new Event("change", { bubbles: true }));
//         }
//     }

//     chrome.storage.local.get(url, (data) => {
//         console.log(data);


//         const valores = data[url] || [];

//         valores.forEach((campo) => {
//             let selector = "";
//             if (campo.name) selector += `[name="${campo.name}"]`;
//             if (campo.id) {
//                 const safeId = CSS.escape(campo.id);
//                 selector += (selector ? ", " : "") + `#${safeId}`;
//             }

//             const el = document.querySelector(selector);
//             if (!el) return;

//             setElementValue(el, (campo.value ?? "").toString().trim());
//         });
//     });
// })();
