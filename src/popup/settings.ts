import {
  DEFAULT_OPTIONS,
  getBlockedUrls,
  updateBlockedUrls,
  normalizeUrl,
} from "../shared";

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

async function createBlockedUrlItem({
  blockedUrl,
  onDelete,
}: {
  blockedUrl: string;
  onDelete?: CallableFunction;
}): Promise<HTMLLIElement> {
  blockedUrl = normalizeUrl({url: blockedUrl});
  const iconResponse = await fetch(browser.runtime.getURL("/icons/trash.svg"));
  const trashIconText = await iconResponse.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(trashIconText, "image/svg+xml");
  const trashIcon = doc.documentElement;
  const li = document.createElement<"li">("li");
  li.className =
    "flex items-center justify-between w-full border rounded border-fg";

  const input = document.createElement<"input">("input");
  input.minLength = 2;
  input.required = true;
  input.type = "text";
  input.id = `url-${blockedUrl}`;
  input.name = `url-${blockedUrl}`;
  input.value =  blockedUrl;
  input.className = "p-2 text-sm w-full";

  const button = document.createElement<"button">("button");
  button.type = "button";
  button.className = "btn font-bold bg-highlight p-1 m-1.5";
  button.id = `remove-btn-${blockedUrl}`;
  button.appendChild(trashIcon.cloneNode(true));

  button.addEventListener("click", () => {
    if (onDelete) {
      onDelete();
    }
    li.remove();
  });

  li.appendChild(input);
  li.appendChild(button);
  return li;
}

async function loadBlockedUrls(blockedUrls: Set<string>) {
  const blockedUrlsList = document.querySelector(
    "#blocked-urls-list",
  ) as HTMLUListElement;
  const blockUrlInput = blockedUrlsList.querySelector(
    "#add-url",
  ) as HTMLInputElement;
  const labelBlockUrlInput = blockedUrlsList.querySelector(
    "label",
  ) as HTMLLabelElement;

  blockedUrlsList.replaceChildren();
  blockUrlInput.value = "";

  for (const blockedUrl of blockedUrls) {
    const li = await createBlockedUrlItem({ blockedUrl });
    blockedUrlsList.appendChild(li);
  }
  blockedUrlsList.appendChild(labelBlockUrlInput);
  blockedUrlsList.appendChild(blockUrlInput);
}
function showSucessMessage() {
  const success = document.querySelector("#success");
  success?.classList.remove("hidden");
  setTimeout(() => {
    success?.classList.add("hidden");
  }, POPUP_TIMEOUT);
}

window.addEventListener("DOMContentLoaded", async () => {
  const blockedUrls = await getBlockedUrls();
  await restoreOptions();
  const form: HTMLFormElement = document.querySelector("#settings-form")!;
  const closeBtn: HTMLButtonElement = document.querySelector("#close-btn")!;
  const blockUrlInput: HTMLInputElement = document.querySelector("#add-url")!;

  blockUrlInput.addEventListener("keydown", async (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      const url = normalizeUrl({
        url: (ev.currentTarget as HTMLInputElement).value.trim(),
      });
      if (url.length <= 2) {
        showError(form, "URL must be at least 2 characters long.");
        return;
      }

      const exists = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          "#blocked-urls-list input:not(#add-url)",
        ),
      ).some((input) => input.value === url);

      const blockUrlInput = document.querySelector(
        "#add-url",
      ) as HTMLInputElement;
      if (exists) {
        blockUrlInput.value = "";
        return;
      }
      const blockedUrlsList = document.querySelector(
        "#blocked-urls-list",
      ) as HTMLUListElement;
      const labelBlockUrlInput = blockedUrlsList.querySelector(
        "label",
      ) as HTMLLabelElement;
      blockUrlInput.remove();
      labelBlockUrlInput.remove();
      const blockedUrlItem = await createBlockedUrlItem({
        blockedUrl: url,
      });
      blockedUrlsList.appendChild(blockedUrlItem);
      blockedUrlsList.appendChild(labelBlockUrlInput);
      blockedUrlsList.appendChild(blockUrlInput);
      blockUrlInput.value = "";
      blockUrlInput.focus();
    }
  });

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
    blockedUrls.clear();
    const inputs = document.querySelectorAll<HTMLInputElement>(
      "#blocked-urls-list input:not(#add-url)",
    );
    inputs.forEach((input) => {
      const url = input.value.trim();
      if (url) blockedUrls.add(url);
    });
    await updateBlockedUrls(blockedUrls);
    if (height < 1 || height > 40) {
      errors.push("Height should be between 1 and 40");
    }
    if (errors.length >= 1) {
      errors.forEach((error) => {
        showError(form, error);
      });
      return;
    }
    saveOptions({ fillColor, backgroundColor, height });
    showSucessMessage();
    browser.runtime.sendMessage({
      type: "settings-update",
    });
  });
});
