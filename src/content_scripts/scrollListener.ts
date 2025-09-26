import { DEFAULT_OPTIONS, getBlockedUrls, isUrlBlocked } from "../shared";
import { type Options } from "../shared";

let isPopupOpen: boolean = false;

async function enableIndicator(): Promise<void> {
  //  TODO: get with default options
  const options = (await browser.storage.sync.get(
    Object.keys(DEFAULT_OPTIONS),
  )) as Options;
  if (Object.keys(options).length < 1) {
    browser.storage.sync.set(DEFAULT_OPTIONS);
  }
  //  TODO: improve how to reload the scroll indicator
  disableIndicator();
  const style = document.createElement("style");
  style.className = "scroll-indicator-style";
  style.textContent = `
    .scroll-indicator { position: fixed; top: 0; left: 0; height: ${options.height}px; width: 100%; background-color: ${options.backgroundColor}; z-index: 9999; pointer-events: none; }
    .scroll-indicator-bar { height: 100%; width: 0%; background-color: ${options.fillColor}; transition: width 0.2s ease; }
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.className = "scroll-indicator";
  const bar = document.createElement("div");
  bar.className = "scroll-indicator-bar";
  bar.id = "scroll-indicator-bar";
  wrapper.appendChild(bar);
  document.body.appendChild(wrapper);

  window.addEventListener("focus", setScrollPercentage);
  window.addEventListener("scroll", scrollHandler);
  scrollHandler();
}

function disableIndicator(): void {
  document
    .querySelectorAll(".scroll-indicator, .scroll-indicator-style")
    .forEach((el) => el.remove());

  window.removeEventListener("focus", setScrollPercentage);
  window.removeEventListener("scroll", scrollHandler);
}

function setScrollPercentage(): void {
  const bar = document.getElementById("scroll-indicator-bar");
  if (!bar) return;
  const scrollPercent = getScrollPercentage();
  bar.style.width = `${scrollPercent}%`;
}

function getScrollPercentage(): number {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const totalHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  if (totalHeight <= 0) return 0;
  return Math.round((scrollTop / totalHeight) * 100);
}

function sendPopupStatus(): void {
  if (isPopupOpen) {
    browser.runtime.sendMessage({
      percent: getScrollPercentage(),
      type: "scroll-event",
    });
  }
}

function scrollHandler(): void {
  setScrollPercentage();
  sendPopupStatus();
}

async function applyCurrentState(): Promise<void> {
  const blockedUrls = await getBlockedUrls();

  if (isUrlBlocked({ url: window.location.hostname, blockedUrls })) {
    disableIndicator();
  } else {
    enableIndicator();
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "get-percent") {
    return Promise.resolve({
      percent: getScrollPercentage(),
    });
  }
  if (typeof message.popupOpen === "boolean") {
    isPopupOpen = message.popupOpen;
    if (isPopupOpen) {
      return Promise.resolve({
        percent: getScrollPercentage(),
        type: "scroll-event",
      });
    }
  }
  if (message.type === "settings-update") {
    applyCurrentState();
  }
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.blockedUrls) {
    applyCurrentState();
  }
});

applyCurrentState();
