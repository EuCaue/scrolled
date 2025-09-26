const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

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

export const getBlockedUrls = async (): Promise<Set<string>> => {
  const { blockedUrls: rawUrls } = await browser.storage.local.get({
    blockedUrls: [],
  });
  const blockedUrls = new Set<string>(rawUrls);
  return blockedUrls;
};

export const updateBlockedUrls = async (
  newBlockedUrls: Set<string> | Array<string>,
): Promise<void> => {
  await browser.storage.local.set({ blockedUrls: Array.from(newBlockedUrls) });
};

export const normalizeUrl = ({ url }: { url: string }): string => {
  
  url = ensureProtocol(url);
  const { host } = new URL(url);
  

  const normalizedHost = host.replace(/^www\./, "");
  return normalizedHost;
};

export const isUrlBlocked = ({
  url,
  blockedUrls,
}: {
  url: string;
  blockedUrls: Set<string> | Array<string>;
}): boolean => {
  url = ensureProtocol(url);

  const { host } = new URL(url);

  const normalizedHost = normalizeUrl({ url });
  for (const blocked of blockedUrls) {
    if (host === blocked || normalizedHost === blocked) return true;
    if (host === blocked || host.endsWith("." + blocked)) return true;
  }

  return false;
};
