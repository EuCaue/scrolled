import "./style.css";
const percentage = window.document.querySelector("#percentage")!;
console.log("GOOD");
// update when open the popup

async function updatePercentage() {
  const [tab]: browser.tabs.Tab[] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const response: Record<any, any> = await browser.tabs.sendMessage(
    tab.id ?? 0,
    {},
  );
  const { percent } = response;
  percentage.textContent = `${percent}%`;
}

browser.runtime.onMessage.addListener(function (response) {
  const { percent, isScrollEvent } = response;
  if (isScrollEvent === true) {
    percentage.textContent = `${percent}%`;
  }
});

async function main() {
  await updatePercentage();
}

main().then(() => console.log("running"));


const port = browser.runtime.connect({ name: "popup" });

port.postMessage({ type: "popup-opened" });

window.addEventListener("unload", () => {
  port.postMessage({ type: "popup-closed" });
});
