import {
  getBlockedUrls,
  updateBlockedUrls,
  isUrlBlocked,
  normalizeUrl,
} from "../shared";
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
  if (!percentage || !tab?.url || !tab.id) return;

  if (isUrlBlocked({ url: tab.url, blockedUrls: await getBlockedUrls() })) {
    percentage.textContent = "N/A";
    return;
  }

  try {
    const response = await browser.tabs.sendMessage(tab.id, {
      type: "get-percent",
    });
    if (response?.percent !== undefined) {
      percentage.textContent = `${response.percent}%`;
    } else {
      percentage.textContent = "N/A";
    }
  } catch (e) {
    console.warn("Error while getting current percent: ", e);
    percentage.textContent = "N/A";
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
      await renderScrollPercentage();
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const isBlocked: boolean = isUrlBlocked({
        url: tab.url ?? "",
        blockedUrls: await getBlockedUrls(),
      });
      toggleBlockedClasses({ isBlocked: isBlocked });
    }
  });

  browser.runtime.onMessage.addListener(async (response) => {
    const { type } = response;
    if (type === "scroll-event") {
      await renderScrollPercentage();
    }
    if (type === "settings-update") {
      await renderScrollPercentage();
    }
  });

  browser.tabs.onActivated.addListener(async () => {
    const blockUrlBtn = document.querySelector(
      "#block-url-btn",
    ) as HTMLButtonElement | null;
    if (!blockUrlBtn) return;
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab.id) return;

    const url = tab.url ?? "";
    const host = normalizeUrl({ url });
    blockUrlBtn.children[1].textContent = host;
    blockUrlBtn.classList.toggle("hidden", url.startsWith("about:"));
    blockUrlBtn.ariaHidden = `${!host}`;
    const isBlocked: boolean = isUrlBlocked({
      url: tab.url ?? "",
      blockedUrls: await getBlockedUrls(),
    });
    toggleBlockedClasses({ isBlocked: isBlocked });
    await renderScrollPercentage();
  });
}

const toggleBlockedClasses = ({ isBlocked }: { isBlocked: boolean }) => {
  const blockUrlBtn = document.querySelector(
    "#block-url-btn",
  ) as HTMLButtonElement | null;
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

async function handleBlockUrls() {
  const blockUrlBtn = document.querySelector(
    "#block-url-btn",
  ) as HTMLButtonElement | null;
  if (!blockUrlBtn) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  const host = normalizeUrl({ url: tab.url ?? "" });
  blockUrlBtn.children[1].textContent = host;
  blockUrlBtn.classList.toggle("hidden", !host);
  blockUrlBtn.ariaHidden = `${!host}`;

  toggleBlockedClasses({
    isBlocked: isUrlBlocked({
      url: tab.url ?? "",
      blockedUrls: await getBlockedUrls(),
    }),
  });

  blockUrlBtn?.addEventListener("click", async (ev) => {
    const url =
      (ev.currentTarget as HTMLButtonElement).querySelector("#url")
        ?.textContent ?? "";
    const blockedUrls = await getBlockedUrls();
    const isBlocked: boolean = isUrlBlocked({ url, blockedUrls });
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
