import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
export const levelColor = {
  "quan trọng": "red",
  "bình thường": "blue",
  "rảnh rỗi": "hotpink",
};
// Nội bộ UI dùng chuẩn này
export const WEEKDAY_ENUM = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Ánh xạ JS getDay() -> chuẩn nội bộ
const JS_DAY_TO_ENUM = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// CHUẨN HÓA string bất kỳ từ BE -> "MON" | "TUE" | ...
export const normalizeDayForEnum = (raw) => {
  const s = String(raw).trim();

  // tiếng Việt
  const vi = s.toUpperCase();
  if (vi === "CN") return "SUN";
  if (vi === "T2") return "MON";
  if (vi === "T3") return "TUE";
  if (vi === "T4") return "WED";
  if (vi === "T5") return "THU";
  if (vi === "T6") return "FRI";
  if (vi === "T7") return "SAT";

  // full EN
  const low = s.toLowerCase();
  if (low.startsWith("mon")) return "MON";
  if (low.startsWith("tue")) return "TUE";
  if (low.startsWith("wed")) return "WED";
  if (low.startsWith("thu")) return "THU";
  if (low.startsWith("fri")) return "FRI";
  if (low.startsWith("sat")) return "SAT";
  if (low.startsWith("sun")) return "SUN";

  // 3-letter EN (any case)
  const up = s.toUpperCase();
  if (["MON","TUE","WED","THU","FRI","SAT","SUN"].includes(up)) return up;

  // fallback: trả nguyên nếu là 1 trong enum nội bộ, nếu không -> null
  return WEEKDAY_ENUM.includes(s) ? s : null;
};

/** Lấy 6x7 ô ngày tháng */
export const getDaysInMonth = (date) => {
  const start = startOfMonth(date);
  const startDay = start.getDay();                   // 0 = Sun
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1; // Monday-first

  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - adjustedStartDay);

  const calendarEnd = new Date(calendarStart);
  calendarEnd.setDate(calendarStart.getDate() + 41);

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(
    (day) => ({
      date: day.getDate(),
      fullDate: day,
      isCurrentMonth: isSameMonth(day, date),
      isToday: isSameDay(day, new Date()),
    })
  );
};

/** Lọc items xuất hiện ở 1 ngày theo nghiệp vụ BE */
export const getTasksForDate = (date, tasks) => {
  const dayEnum = JS_DAY_TO_ENUM[date.getDay()]; 
  return tasks.filter((t) => {
    if (t.task_mode === "dài hạn") {
      const d = new Date(date).setHours(0, 0, 0, 0);
      const s = new Date(t.start_time).setHours(0, 0, 0, 0);
      const e = new Date(t.end_time).setHours(0, 0, 0, 0);
      return d >= s && d <= e;
    }
    if (t.task_mode === "hàng ngày") {
      // normalize để an toàn nếu có record cũ khác format
      const td = t.task_day ? normalizeDayForEnum(t.task_day) : null;
      return td === dayEnum;
    }
    return false;
  });
};

export const changeMonth = (currentDate, direction) =>
  direction === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
