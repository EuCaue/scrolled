import {
  DEFAULT_OPTIONS,
  getBlockedUrls,
  updateBlockedUrls,
  normalizeUrl,
  getOptions,
  debouncer,
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
  const span: HTMLSpanElement = document.createElement("span");
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
    "transition-all",
    "animate-[slide-up_0.4s_ease-in-out]",
  ];
  span.classList.add(...cls);
  span.innerText = msg;
  el.after(span);

  setTimeout(() => {
    span.classList.remove("animate-[slide-up_0.4s_ease-in-out]");
    setTimeout(() => {
      span.classList.add("animate-[slide-up_0.4s_ease-in-out_reverse]");
      span.addEventListener("animationend", () => span.remove(), {
        once: true,
      });
    }, 100);
  }, ms);
}

async function saveOptions(options: any) {
  try {
    await browser.storage.sync.set(options);
  } catch (e) {
    console.log("Error while saving options: ", e);
  }
}

async function restoreOptions() {
  const options = await getOptions();
  const settingsInputs: NodeListOf<HTMLInputElement> =
    document.querySelectorAll("#settings-form input");
  settingsInputs.forEach((el) => {
    const key = toCamelCase(el.name.split("-")) as keyof typeof DEFAULT_OPTIONS;
    const value = options[key];
    el.value = value as string;
  });
  const position = document.querySelector<HTMLSelectElement>(
    "#settings-form select",
  )!;
  const positionsOptions: HTMLOptionElement[] = Array.from(position.options);
  for (const option of positionsOptions) {
    if (option.value === options.pos) {
      option.selected = true;
      break;
    }
  }
}

async function createBlockedUrlItem({
  blockedUrl,
  onDelete,
  blockedUrls,
}: {
  blockedUrl: string;
  blockedUrls: Set<string>;
  onDelete?: CallableFunction;
}): Promise<HTMLLIElement> {
  blockedUrl = normalizeUrl({ url: blockedUrl });
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
  input.value = blockedUrl;
  input.className = "p-2 text-sm w-full";

  input.addEventListener(
    "input",
    debouncer({
      cb: async () => {
        const newUrl = normalizeUrl({ url: input.value.trim() });
        if (newUrl.length <= 2) {
          const form = document.querySelector("#settings-form") as HTMLElement;
          showError(form, "URL must be at least 2 characters long.");
          input.value = blockedUrl;
          return;
        }
        if (blockedUrls.has(newUrl) && newUrl !== blockedUrl) {
          const form = document.querySelector("#settings-form") as HTMLElement;
          showError(form, "URL already in the block list.");
          input.value = blockedUrl;
          return;
        }
        if (newUrl !== blockedUrl) {
          blockedUrls.delete(blockedUrl);
          blockedUrls.add(newUrl);
          await updateBlockedUrls(blockedUrls);
          blockedUrl = newUrl;
        }
      },
      delay: 500,
    }),
  );

  const removeButton = document.createElement<"button">("button");
  removeButton.type = "button";
  removeButton.ariaLabel = `Remove ${blockedUrl} from blocked list.`;
  removeButton.title = `Remove ${blockedUrl} from blocked list.`;
  removeButton.className = "btn font-bold bg-highlight p-1 m-1.5";
  removeButton.id = `remove-btn-${blockedUrl}`;
  removeButton.appendChild(trashIcon.cloneNode(true));

  removeButton.addEventListener("click", async () => {
    if (onDelete) {
      onDelete();
    }
    li.classList.remove("animate-[slide-up_0.6s_ease-in-out]");
    setTimeout(() => {
      li.classList.add("animate-[slide-up_0.4s_ease-in-out_reverse]");
    }, 100);
    li.addEventListener("animationend", async () => {
      li.remove();
      blockedUrls.delete(blockedUrl);
      await updateBlockedUrls(blockedUrls);
    });
  });

  li.appendChild(input);
  li.appendChild(removeButton);
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
    const li = await createBlockedUrlItem({ blockedUrl, blockedUrls });
    blockedUrlsList.appendChild(li);
  }
  blockedUrlsList.appendChild(labelBlockUrlInput);
  blockedUrlsList.appendChild(blockUrlInput);
  blockUrlInput.focus();
}

async function handleAddBlockedUrl(
  ev: KeyboardEvent,
  form: HTMLFormElement,
): Promise<void> {
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

  const blockUrlInput = document.querySelector("#add-url") as HTMLInputElement;
  if (exists) {
    blockUrlInput.value = "";
    showError(form, "URL already in the block list.");
    return;
  }
  const blockedUrls = await getBlockedUrls();
  blockedUrls.add(url);
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
    blockedUrls,
  });
  blockedUrlsList.appendChild(blockedUrlItem);
  blockedUrlsList.appendChild(labelBlockUrlInput);
  blockedUrlsList.appendChild(blockUrlInput);
  await updateBlockedUrls(blockedUrls);
}

async function setupAutoSaveListeners() {
  document
    .querySelectorAll("#settings-form ul:first-child input, select")
    .forEach((el) => {
      const debouncedSave = debouncer({
        cb: async () => {
          const value = (el as HTMLInputElement).value;
          const key = toCamelCase(el.id.split("-"));
          await saveOptions({ [key]: value });
          browser.runtime.sendMessage({
            type: "settings-update",
          });
        },
        delay: 175,
      });
      el.addEventListener("input", () => {
        debouncedSave();
      });
    });
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
      await handleAddBlockedUrl(ev, form);
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

  await setupAutoSaveListeners();
});
