import "./style.css";
//  TODO: change storage.local to sync

async function updatePercentage(percentage: HTMLSpanElement) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  const response = await browser.tabs.sendMessage(tab.id, {});
  if (response?.percent !== undefined) {
    percentage.textContent = `${response.percent}%`;
  }
}

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

async function updateBlockedUrls(blockedUrls: Set<string>) {
  await browser.storage.local.set({ blockedUrls });
}

async function handleUrl({
  blockedUrls,
  url,
  el,
}: {
  blockedUrls: Set<string>;
  url: string;
  el: HTMLElement;
}) {
  const isBlocked = blockedUrls.has(url);
  el.classList.toggle("bg-highlight", !isBlocked);
  if (isBlocked) {
    blockedUrls.delete(url);
  } else {
    blockedUrls.add(url);
  }
  await updateBlockedUrls(blockedUrls);
}

async function handleToggleSites() {
  const disableBtn = document.querySelector(
    "#disable-btn",
  ) as HTMLButtonElement | null;
  if (!disableBtn) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  const { host } = new URL(tab.url ?? "");
  disableBtn.textContent = host;
  const { blockedUrls } = (await browser.storage.local.get({
    blockedUrls: new Set(),
  })) as {
    blockedUrls: Set<string>;
  };

  const isUrlBlocked = blockedUrls.has(host);
  if (isUrlBlocked) {
    disableBtn.classList.toggle("bg-highlight", isUrlBlocked);
  }

  disableBtn?.addEventListener("click", (ev) => {
    const url = (ev.currentTarget as HTMLButtonElement).textContent ?? "";
    handleUrl({ blockedUrls, el: disableBtn, url });
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const percentage = document.querySelector(
    "#percentage",
  ) as HTMLSpanElement | null;
  const settingsBtn = document.querySelector(
    "#settings-btn",
  ) as HTMLButtonElement | null;

  if (!percentage || !settingsBtn) return;
  handleToggleSites();

  settingsBtn.addEventListener("click", async () => {
    await browser.windows.create({
      url: "settings.html",
      type: "popup",
      width: 320,
      height: 320,
    });
  });

  await updatePercentage(percentage);
  console.log("running");
});
