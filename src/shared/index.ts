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
};

export const DEFAULT_OPTIONS: Options = {
  height: 6,
  fillColor: "#3584e4",
  backgroundColor: isDarkMode ? "#000000" : "#ffffff",
  pos: "TOP",
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
  if (url.startsWith("about")) {
    return false;
  }
  url = ensureProtocol(url);

  const normalizedHost = normalizeUrl({ url });
  for (const blocked of blockedUrls) {
    if (
      url === blocked ||
      normalizedHost === blocked ||
      url.endsWith(`.${blocked}`)
    )
      return true;
  }
  return false;
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
