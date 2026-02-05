const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export type Options = {
  height: number;
  fillColor: string;
  backgroundColor: string;
  pos: string;
  mode: Mode;
};

export const DEFAULT_OPTIONS: Options = {
  height: 6,
  fillColor: "#3584e4",
  backgroundColor: isDarkMode ? "#000000" : "#ffffff",
  pos: "TOP",
  mode: "blacklist"
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

/*
Determines if a URL should be blocked based on the current mode (blacklist or whitelist).
*/
export const isUrlBlocked = async ({
  url,
  blockedUrls,
}: {
  url: string;
  blockedUrls: Set<string> | Array<string>;
}): Promise<boolean> => {
  if (url.startsWith("about")) {
    return false;
  }
  url = ensureProtocol(url);

  const normalizedHost = normalizeUrl({ url });
  const mode = await getMode();

  // Blacklist mode: block URLs that match any entry in blockedUrls
  if (mode === "blacklist") {
    for (const blocked of blockedUrls) {
      if (
        url === blocked ||
        normalizedHost === blocked ||
        url.endsWith(`.${blocked}`)
      )
        return true;
    }
    return false;
  }

  // Whitelist mode: block URLs that do NOT match any entry in blockedUrls
  // If a URL matches an entry in the whitelist, it is allowed (not blocked).
  for (const allowed of blockedUrls) {
    if (
      url === allowed ||
      normalizedHost === allowed ||
      url.endsWith(`.${allowed}`)
    ) {
      return false;
    }
  }
  return true;
};

export const getOptions = async (fields?: Partial<Options>) => {
  fields = fields ?? {};
  const stored = await browser.storage.sync.get();

  // If storage is empty, set defaults
  if (Object.keys(stored).length === 0) {
    await browser.storage.sync.set(DEFAULT_OPTIONS);
    return { ...DEFAULT_OPTIONS, ...fields };
  }

  return { ...DEFAULT_OPTIONS, ...stored, ...fields } as Options;
};

export const debouncer = <T extends any[]>({
  cb,
  delay = 300,
}: {
  cb: (...args: T) => void;
  delay?: number;
}) => {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: T) {
    if (timeout) clearTimeout(timeout);
    const context = this;
    timeout = setTimeout(() => cb.apply(context, args), delay);
  };
};

export type Mode = "whitelist" | "blacklist";

export const getMode = async (): Promise<Mode> => {
  const { mode } = await browser.storage.sync.get({
    mode: "blacklist",
  });
  return mode;
};

export const updateMode = async (mode: Mode) => {
  await browser.storage.sync.set({ mode });
};
