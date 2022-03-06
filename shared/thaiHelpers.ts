import dayjs, { Dayjs, ConfigType } from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import th from "dayjs/locale/th";
dayjs.locale(th);
dayjs.extend(LocalizedFormat);

export function formatDateTime(dateTime: ConfigType) {
  return dayjs(dateTime).format("LL - HH:mm น.");
}

type DIGITS = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const thaiDigits: Record<DIGITS | string, string> = {
  "0": "๐",
  "1": "๑",
  "2": "๒",
  "3": "๓",
  "4": "๔",
  "5": "๕",
  "6": "๖",
  "7": "๗",
  "8": "๘",
  "9": "๙",
};

export function convertToThaiDigits(number: number, bypass?: boolean): string {
  if (bypass) return number.toString();
  return number
    .toString()
    .split("")
    .map((v) => thaiDigits[`${v}`])
    .join("");
}
