import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import localizedFormat from "dayjs/plugin/localizedFormat";
import th from "dayjs/locale/th";
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.locale(th);

export { dayjs as default };
