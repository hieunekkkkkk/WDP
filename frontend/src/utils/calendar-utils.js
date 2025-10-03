import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';

/**
 * Lấy tất cả các ngày cần hiển thị trong calendar (42 ô)
 */
export const getDaysInMonth = (date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  // Lấy ngày đầu tiên trong tuần (Monday)
  const startDay = start.getDay();
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  // Ngày bắt đầu hiển thị
  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - adjustedStartDay);

  // Ngày kết thúc (42 ô = 6 hàng)
  const calendarEnd = new Date(calendarStart);
  calendarEnd.setDate(calendarStart.getDate() + 41);

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(day => ({
    date: day.getDate(),
    fullDate: day,
    isCurrentMonth: isSameMonth(day, date),
    isToday: isSameDay(day, new Date())
  }));
};

/**
 * Lấy events theo ngày
 */
export const getEventsByDate = (date, events) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return events[dateStr] || [];
};

/**
 * Chuyển tháng
 * @param {Date} currentDate 
 * @param {Number} direction 1 = next, -1 = prev
 */
export const changeMonth = (currentDate, direction) => {
  return direction === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
};
