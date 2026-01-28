import { getBlockedUrls, getOptions, isUrlBlocked } from "../shared";
import { type Options } from "../shared";

let isPopupOpen: boolean = false;

async function enableIndicator(): Promise<void> {
  const options: Options = await getOptions();
  //  TODO: improve how to reload the scroll indicator
  disableIndicator();

  if (!document.querySelector(".scroll-indicator-style")) {
    const style = document.createElement("style");
    style.className = "scroll-indicator-style";
    style.textContent = `
      .scroll-indicator {
        position: fixed;
        background-color: ${options.backgroundColor};
        z-index: 9999;
        pointer-events: none;
      }
      .scroll-indicator-bar {
        background-color: ${options.fillColor};
        transition: all 0.2s ease;
      }
      /* horizontal */
      .scroll-indicator.top {
        top: 0; left: 0; height: ${options.height}px; width: 100%;
      }
      .scroll-indicator.bottom {
        bottom: 0; left: 0; height: ${options.height}px; width: 100%;
      }
      .scroll-indicator-bar.horizontal {
        height: 100%; width: 0%;
      }
      /* vertical */
      .scroll-indicator.left {
        top: 0; left: 0; width: ${options.height}px; height: 100%;
      }
      .scroll-indicator.right {
        top: 0; right: 0; width: ${options.height}px; height: 100%;
      }
      .scroll-indicator-bar.vertical {
        width: 100%; height: 0%;
      }
    `;
    document.head.appendChild(style);
  }

  const wrapper = document.createElement("div");
  wrapper.className =
    "scroll-indicator " + (options.pos.toLowerCase() ?? "TOP");

  const bar = document.createElement("div");
  bar.className =
    "scroll-indicator-bar " +
    (["TOP", "BOTTOM"].includes(options.pos) ? "horizontal" : "vertical");
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
  if (bar.classList.contains("horizontal")) {
    bar.style.width = `${scrollPercent}%`;
  } else {
    bar.style.height = `${scrollPercent}%`;
  }
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
  if (isUrlBlocked({ url: window.location.host, blockedUrls })) {
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
