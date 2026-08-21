const VIM_KEY = "xtype:vim-enabled";
const SPLIT_KEY = "xtype:split-view";

export function isVimEnabled(): boolean {
  try {
    return localStorage.getItem(VIM_KEY) === "1";
  } catch {
    return false;
  }
}

export function setVimEnabled(on: boolean) {
  try {
    localStorage.setItem(VIM_KEY, on ? "1" : "0");
  } catch {}
  window.dispatchEvent(new CustomEvent("xtype:vim-changed", { detail: on }));
}

export function isSplitView(): boolean {
  try {
    return localStorage.getItem(SPLIT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSplitView(on: boolean) {
  try {
    localStorage.setItem(SPLIT_KEY, on ? "1" : "0");
  } catch {}
  window.dispatchEvent(new CustomEvent("xtype:split-changed", { detail: on }));
}
