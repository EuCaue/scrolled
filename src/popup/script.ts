import "./style.css";

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

window.addEventListener("DOMContentLoaded", async () => {
  const percentage = document.querySelector(
    "#percentage",
  ) as HTMLSpanElement | null;
  const settingsBtn = document.querySelector(
    "#settings-btn",
  ) as HTMLButtonElement | null;

  if (!percentage || !settingsBtn) return;

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
