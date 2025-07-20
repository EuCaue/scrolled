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

