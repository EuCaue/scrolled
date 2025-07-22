import "./style.css";
//  TODO: change storage.local to sync

function handlePopupMessaging() {
  const port = browser.runtime.connect({ name: "popup" });

  port.postMessage({ type: "popup-opened" });

  window.addEventListener("unload", () => {
    port.postMessage({ type: "popup-closed" });
  });

  browser.runtime.onMessage.addListener((response) => {
    const { percent, isScrollEvent } = response;
    if (isScrollEvent === true) {
      const percentage = document.querySelector(
        "#percentage",
      ) as HTMLSpanElement | null;
      if (percentage) {
        percentage.textContent = `${percent}%`;
      }
    }
  });
}

async function updatePercentage(percentage: HTMLSpanElement) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  const response = await browser.tabs.sendMessage(tab.id, {});
  if (response?.percent !== undefined) {
    percentage.textContent = `${response.percent}%`;
  }
}

async function updateBlockedUrls(blockedUrls: Set<string>) {
  await browser.storage.local.set({ blockedUrls });
}

async function toggleUrlBlocked({
  blockedUrls,
  url,
  el,
}: {
  blockedUrls: Set<string>;
  url: string;
  el: HTMLElement;
}) {
  const isBlocked: boolean = blockedUrls.has(url);
  el.classList.toggle("bg-highlight", !isBlocked);
  el.classList.toggle("text-muted", !isBlocked);
  el.classList.toggle("font-light", !isBlocked);
  if (isBlocked) {
    blockedUrls.delete(url);
  } else {
    blockedUrls.add(url);
  }
  await updateBlockedUrls(blockedUrls);
}

async function handleBlockUrls() {
  const blockUrlBtn = document.querySelector(
    "#block-url-btn",
  ) as HTMLButtonElement | null;
  if (!blockUrlBtn) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  const { host } = new URL(tab.url ?? "");
  blockUrlBtn.children[1].textContent = host;
  blockUrlBtn.classList.toggle("hidden", !host);

  const { blockedUrls } = (await browser.storage.local.get({
    blockedUrls: new Set(),
  })) as {
    blockedUrls: Set<string>;
  };
  const isUrlBlocked = blockedUrls.has(host);
  blockUrlBtn.classList.toggle("bg-highlight", isUrlBlocked);
  blockUrlBtn.classList.toggle("text-muted", isUrlBlocked);
  blockUrlBtn.classList.toggle("font-light", isUrlBlocked);
  blockUrlBtn?.addEventListener("click", (ev) => {
    const url =
      (ev.currentTarget as HTMLButtonElement).querySelector("#url")
        ?.textContent ?? "";
    toggleUrlBlocked({ blockedUrls, el: blockUrlBtn, url });
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

  await updatePercentage(percentage);
  console.log("Popup Loaded.");
});
