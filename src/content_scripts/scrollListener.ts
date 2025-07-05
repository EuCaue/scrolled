import { DEFAULT_OPTIONS } from "../shared";
import { type Options } from "../shared";

let isPopupOpen: boolean = false;

async function createScrollIndicator(): Promise<void> {
  const options = (await browser.storage.sync.get(
    Object.keys(DEFAULT_OPTIONS),
  )) as Options;
  if (Object.keys(options).length < 1) {
    browser.storage.sync.set(DEFAULT_OPTIONS);
  }
  const style = document.createElement("style");
  document
    .querySelectorAll(".scroll-indicator")
    .forEach((prevScrollIndicator) => {
      prevScrollIndicator.remove();
    });
  style.textContent = `
  .scroll-indicator {
    position: fixed;
    top: 0;
    left: 0;
    height: ${options.height}px;
    width: 100%;
    background-color: ${options.backgroundColor};
    z-index: 9999;
    pointer-events: none;
  }

  .scroll-indicator-bar {
    height: 100%;
    width: 0%;
    background-color: ${options.fillColor};
    transition: width 0.2s ease;
  }
`;
  document.head.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.className = "scroll-indicator";

  const bar = document.createElement("div");
  bar.className = "scroll-indicator-bar";
  bar.id = "scroll-indicator-bar";

  wrapper.appendChild(bar);
  document.body.appendChild(wrapper);
  setScrollPercentage();
}

function setScrollPercentage(): void {
  const scrollPercent = getScrollPercentage();
  const bar = document.getElementById("scroll-indicator-bar");
  if (bar) {
    bar.style.width = `${scrollPercent}%`;
  }
}

function getScrollPercentage(): number {
  const scrollTop: number =
    window.scrollY || document.documentElement.scrollTop;
  const totalHeight: number =
    document.documentElement.scrollHeight - window.innerHeight;
  const percentage: number = (scrollTop / totalHeight) * 100;
  return Math.round(percentage);
}

window.addEventListener("focus", function () {
  setScrollPercentage();
});

window.addEventListener("scroll", function () {
  setScrollPercentage();
  if (isPopupOpen) {
    browser.runtime.sendMessage(
      {
        percent: getScrollPercentage(),
        isScrollEvent: true,
      },
      {},
    );
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (typeof message.popupOpen === "boolean") {
    isPopupOpen = message.popupOpen;
  }
  if (message.type === "settings-update") {
    createScrollIndicator();
  }
});

createScrollIndicator();
