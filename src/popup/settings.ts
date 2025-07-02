type Options = {
  height: number;
  color: string;
};

const DEFAULT_OPTIONS: Options = {
  height: 4,
  color: "#5555f5",
};

function showError(el: HTMLElement, msg: string, ms: number = 1800): void {
  const span = document.createElement("span");
  const cls: Array<string> = [
    "bg-red-400",
    "font-bold",
    "text-md",
    "text-center",
    "text-default",
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

  const timeoutID = setTimeout(() => {
    span.remove();
  }, ms);
  clearTimeout(timeoutID);
}

function saveOptions(options: Options) {
  browser.storage.sync.set(options);
}

async function restoreOptions() {
  const options = await browser.storage.sync.get(["color", "height"]);
  const settingsInputs: NodeListOf<HTMLInputElement> =
    document.querySelectorAll("#settings-form input");
  if (Object.keys(options).length < 1) {
    console.log("no options saved");
    settingsInputs.forEach((el) => {
      const key = el.name;
      options[key] = el.value;
    });
  }
  settingsInputs.forEach((el) => {
    const key = el.name;
    const value = options[key];
    el.value = value;
  });
}

function showSucessMessage() {
  const success = document.querySelector("#success");
  success?.classList.remove("hidden");
  console.log(success?.classList);
  const timeoutID = setTimeout(() => {
    success?.classList.add("hidden");
  }, 1250);
  clearTimeout(timeoutID);
}

window.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  const form = document.querySelector("#settings-form") as HTMLFormElement;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    let hasError = false;
    const formData: FormData = new FormData(form);
    const color = formData.get("color") as string;
    const height = Number(formData.get("height") ?? 0);

    //@ts-ignore
    if (height < 1 || height > 40) {
      showError(form, "Height should be between 1 and 40");
      return;
    }
    saveOptions({ color, height });
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    browser.tabs.sendMessage(tab.id ?? 0, {
      type: "settings-update",
      payload: {color, height},
    });
    showSucessMessage();
  });
});
