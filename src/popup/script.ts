import { getBlockedUrls, updateBlockedUrls } from "../shared";
import "./style.css";
//  TODO: change storage.local to sync

async function renderScrollPercentage() {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const percentage = document.querySelector(
    "#percentage",
  ) as HTMLSpanElement | null;
  if (!percentage) return;
  const { host } = new URL(tab.url ?? "");
  const blockedUrls = await getBlockedUrls();
  if (blockedUrls.has(host)) {
    percentage.textContent = "N/A";
  } else {
    updatePercentage(percentage);
  }
}

async function updatePercentage(percentage: HTMLSpanElement) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  const response = await browser.tabs.sendMessage(tab.id, {});
  if (response?.percent !== undefined) {
    percentage.textContent = `${response.percent}%`;
  }
}

function handlePopupMessaging() {
  const port = browser.runtime.connect({ name: "popup" });

  port.postMessage({ type: "popup-opened" });

  window.addEventListener("unload", () => {
    port.postMessage({ type: "popup-closed" });
  });
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.blockedUrls) {
      renderScrollPercentage();
    }
  });

  browser.runtime.onMessage.addListener((response) => {
    const { percent, isScrollEvent, type } = response;
    if (isScrollEvent === true) {
      const percentage = document.querySelector(
        "#percentage",
      ) as HTMLSpanElement | null;
      if (percentage) {
        percentage.textContent = `${percent}%`;
      }
    }
    if (type === "settings-update") {
      renderScrollPercentage();
    }
  });
}

async function handleBlockUrls() {
  const toggleBlockedClasses = ({ isBlocked }: { isBlocked: boolean }) => {
    if (!blockUrlBtn) return;
    const blockedClasses: Array<string> = [
      "bg-highlight",
      "text-muted",
      "font-light",
    ];
    blockedClasses.forEach((className) => {
      blockUrlBtn.classList.toggle(className, isBlocked);
    });
  };
  const blockUrlBtn = document.querySelector(
    "#block-url-btn",
  ) as HTMLButtonElement | null;
  if (!blockUrlBtn) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  const { host } = new URL(tab.url ?? "");
  blockUrlBtn.children[1].textContent = host;
  blockUrlBtn.classList.toggle("hidden", !host);
  blockUrlBtn.ariaHidden = `${!host}`;

  const blockedUrls = await getBlockedUrls()
  const isUrlBlocked = blockedUrls.has(host);
  toggleBlockedClasses({ isBlocked: isUrlBlocked });
  blockUrlBtn?.addEventListener("click", (ev) => {
    const url =
      (ev.currentTarget as HTMLButtonElement).querySelector("#url")
        ?.textContent ?? "";
    const isBlocked: boolean = blockedUrls.has(url);
    toggleBlockedClasses({ isBlocked: !isBlocked });
    if (isBlocked) {
      blockedUrls.delete(url);
    } else {
      blockedUrls.add(url);
    }
    updateBlockedUrls(blockedUrls);
  });
}

handlePopupMessaging();
window.addEventListener("DOMContentLoaded", async () => {
  const percentage = document.querySelector(
    "#percentage",
  ) as HTMLSpanElement | null;
  const settingsBtn = document.querySelector(
    "#settings-btn",
  ) as HTMLButtonElement | null;

  if (!percentage || !settingsBtn) return;
  handleBlockUrls();

  settingsBtn.addEventListener("click", async () => {
    await browser.windows.create({
      url: "settings.html",
      type: "popup",
      width: 320,
      height: 320,
    });
  });

  await renderScrollPercentage();
  console.debug("Popup Loaded.");
});
