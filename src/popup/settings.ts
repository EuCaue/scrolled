import { DEFAULT_OPTIONS } from "../shared";

const POPUP_TIMEOUT: number = 1850;

function toCamelCase(words: Array<string>): string {
  return words
    .map((w, i) => {
      if (i === 0) {
        return w;
      }
      const camelCase = `${w.substring(0, 1).toLocaleUpperCase()}${w.substring(1)}`;
      return camelCase;
    })
    .join("");
}

function showError(
  el: HTMLElement,
  msg: string,
  ms: number = POPUP_TIMEOUT,
): void {
  const span = document.createElement("span");
  const cls: Array<string> = [
    "bg-red-400",
    "font-bold",
    "text-md",
    "text-center",
    "text-fg",
    "w-fit",
    "m-auto",
    "p-2",
    "rounded",
    "shadow-sm",
    "hover:shadow-lg",
    "hover:mb-1",
    "transition-all",
  ];
  span.classList.add(...cls);
  span.innerText = msg;
  el.after(span);

  setTimeout(() => {
    span.remove();
  }, ms);
}

function saveOptions(options: any) {
  browser.storage.sync.set(options);
}

async function restoreOptions() {
  const options = await browser.storage.sync.get(Object.keys(DEFAULT_OPTIONS));
  if (Object.keys(options).length < 1) {
    saveOptions(DEFAULT_OPTIONS);
  }
  const settingsInputs: NodeListOf<HTMLInputElement> =
    document.querySelectorAll("#settings-form input");
  settingsInputs.forEach((el) => {
    const key = toCamelCase(el.name.split("-")) as keyof typeof DEFAULT_OPTIONS;
    const value = options[key];
    el.value = value;
  });
}

function showSucessMessage() {
  const success = document.querySelector("#success");
  success?.classList.remove("hidden");
  setTimeout(() => {
    success?.classList.add("hidden");
  }, POPUP_TIMEOUT);
}

window.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  const form: HTMLFormElement = document.querySelector("#settings-form")!;
  const closeBtn: HTMLButtonElement = document.querySelector("#close-btn")!;
  closeBtn.addEventListener("click", async () => {
    const windowID = (await browser.windows.getCurrent())?.id ?? 0;
    browser.windows.remove(windowID);
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const formData: FormData = new FormData(form);
    const fillColor = formData.get("fill-color") as string;
    const backgroundColor = formData.get("background-color") as string;
    const height = Number(formData.get("height") ?? 0);

    if (height < 1 || height > 40) {
      showError(form, "Height should be between 1 and 40");
      return;
    }
    saveOptions({ fillColor, backgroundColor, height });
    showSucessMessage();
    browser.runtime.sendMessage({
      type: "settings-update",
    });
  });
});
