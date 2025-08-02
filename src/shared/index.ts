const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

export type Options = {
  height: number;
  fillColor: string;
  backgroundColor: string;
};

export const DEFAULT_OPTIONS: Options = {
  height: 6,
  fillColor: "#3584e4",
  backgroundColor: isDarkMode ? "#000000" : "#ffffff",
};

export const getBlockedUrls: () => Promise<Set<string>> = async () => {
  const { blockedUrls: rawUrls } = await browser.storage.local.get({
    blockedUrls: [],
  });
  const blockedUrls = new Set<string>(rawUrls);
  return blockedUrls;
};

export const updateBlockedUrls = async (
  newBlockedUrls: Set<string> | Array<string>,
) => {
  await browser.storage.local.set({ blockedUrls: Array.from(newBlockedUrls) });
};
