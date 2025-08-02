import { DEFAULT_OPTIONS, getBlockedUrls, updateBlockedUrls } from "../shared";

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

async function saveOptions(options: any) {
  try {
    await browser.storage.sync.set(options);
  } catch (error) {
    console.error("Error while saving options: ", error);
  }
}

async function restoreOptions() {
  const stored = await browser.storage.sync.get(Object.keys(DEFAULT_OPTIONS));

  if (Object.keys(stored).length === 0) {
    await saveOptions(DEFAULT_OPTIONS);
  }

  const options = { ...DEFAULT_OPTIONS, ...stored };
  const settingsInputs: NodeListOf<HTMLInputElement> =
    document.querySelectorAll("#settings-form input");
  settingsInputs.forEach((el) => {
    const key = toCamelCase(el.name.split("-")) as keyof typeof DEFAULT_OPTIONS;
    const value = options[key];
    el.value = value as string;
  });
}

async function loadBlockedUrls(blockedUrls: Set<string>) {
  const blockedUrlsList = document.querySelector(
    "#blocked-urls-list",
  ) as HTMLUListElement;
  if (blockedUrlsList.hasChildNodes()) {
    blockedUrlsList.replaceChildren();
  }
  const removeBlockedUrl = async (blockedUrlToRemove: string) => {
    blockedUrls.delete(blockedUrlToRemove);
    return blockedUrlToRemove;
  };
  const icon = await fetch(browser.runtime.getURL("/icons/trash.svg"));
  const trashIcon = await icon.text();
  blockedUrls.forEach((blockedUrl) => {
    const li = document.createElement<"li">("li");
    li.className =
      "flex items-center justify-between w-full border rounded border-fg";

    const input = document.createElement<"input">("input");
    input.minLength = 2;
    input.required = true;
    input.type = "text";
    input.id = `url-${blockedUrl}`;
    input.name = `url-${blockedUrl}`;
    input.value = blockedUrl;
    input.className = "p-2 text-sm w-full";
    input.addEventListener("blur", () => {
      if (blockedUrls.has(blockedUrl)) {
        blockedUrls.delete(blockedUrl);
      }
      const newBlockedUrlValue = input.value;
      blockedUrls.add(newBlockedUrlValue);
      input.id = `url-${newBlockedUrlValue}`;
      input.name = `url-${newBlockedUrlValue}`;
      input.value = newBlockedUrlValue;
    });
    const button = document.createElement<"button">("button");
    button.type = "button";
    button.className = "btn font-bold bg-highlight p-1 m-1.5";
    button.id = `remove-btn-${blockedUrl}`;
    button?.insertAdjacentHTML("afterbegin", trashIcon);

    button.addEventListener("click", async () => {
      li.remove();
      await removeBlockedUrl(blockedUrl);
    });

    li.appendChild(input);
    li.appendChild(button);

    blockedUrlsList.appendChild(li);
  });
}

function showSucessMessage() {
  const success = document.querySelector("#success");
  success?.classList.remove("hidden");
  setTimeout(() => {
    success?.classList.add("hidden");
  }, POPUP_TIMEOUT);
}

const isValidHost = (str: string) =>
  /^(localhost|\d{1,3}(\.\d{1,3}){3}|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:\d{1,5})?$/.test(
    str,
  );

window.addEventListener("DOMContentLoaded", async () => {
  const blockedUrls = await getBlockedUrls();
  await restoreOptions();
  const form: HTMLFormElement = document.querySelector("#settings-form")!;
  const closeBtn: HTMLButtonElement = document.querySelector("#close-btn")!;
  closeBtn.addEventListener("click", async () => {
    const windowID = (await browser.windows.getCurrent())?.id ?? 0;
    browser.windows.remove(windowID);
  });
  await loadBlockedUrls(blockedUrls);
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.blockedUrls) {
      const blockedUrls = await getBlockedUrls();
      await loadBlockedUrls(blockedUrls);
    }
  });
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const formData: FormData = new FormData(form);
    const fillColor = formData.get("fill-color") as string;
    const backgroundColor = formData.get("background-color") as string;
    const height = Number(formData.get("height") ?? 0);
    const errors: Array<string> = [];
    if (height < 1 || height > 40) {
      errors.push("Height should be between 1 and 40");
    }
    for (const [k, v] of formData.entries()) {
      if (k.startsWith("url-") && !isValidHost(v as string)) {
        errors.push(`(${v}): is not a valid url.`);
      }
    }
    if (errors.length >= 1) {
      errors.forEach((error) => {
        showError(form, error);
      });
      return;
    }
    await updateBlockedUrls(blockedUrls);
    saveOptions({ fillColor, backgroundColor, height });
    showSucessMessage();
    browser.runtime.sendMessage({
      type: "settings-update",
    });
  });
});
