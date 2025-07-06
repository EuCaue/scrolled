import "./style.css";
const percentage: HTMLSpanElement =
  window.document.querySelector("#percentage")!;
const settingsBtn: HTMLButtonElement =
  window.document.querySelector("#settings-btn")!;

settingsBtn.addEventListener("click", async () => {
  await browser.windows.create({
    url: "settings.html",
    type: "popup",
    width: 320,
    height: 320,
  });
});

async function updatePercentage() {
  const [tab]: browser.tabs.Tab[] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const response: Record<any, any> = await browser.tabs.sendMessage(
    tab.id ?? 0,
    {},
  );
  if (response) {
    const { percent } = response;
    percentage.textContent = `${percent}%`;
  }
}

browser.runtime.onMessage.addListener(function (response) {
  const { percent, isScrollEvent } = response;
  if (isScrollEvent === true) {
    percentage.textContent = `${percent}%`;
  }
});

(async () => {
  await updatePercentage();
  console.log("running");
})();

const port = browser.runtime.connect({ name: "popup" });

port.postMessage({ type: "popup-opened" });

window.addEventListener("unload", () => {
  port.postMessage({ type: "popup-closed" });
});
