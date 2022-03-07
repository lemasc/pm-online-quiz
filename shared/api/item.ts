export function itemToCharCode(item: number | string): string {
  return item
    .toString()
    .split("")
    .map((v) => String.fromCharCode(parseInt(v) + 64))
    .join("");
}

export function charCodeToItem(code: string): number {
  return code
    .split("")
    .reverse()
    .reduce((value, code, i) => {
      return value + (code.charCodeAt(0) - 64) * 10 ** i;
    }, 0);
}
