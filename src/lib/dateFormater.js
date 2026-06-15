const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const parseValidDate = (dateString) => {
  if (dateString === null || dateString === undefined || dateString === "") {
    return null;
  }

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
};

export const formatDate = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

export const formatDateLong = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

export const formatDateWithDay = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const dayName = DAYS[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

export const formatDateSlash = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatDateDash = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export const formatDateTime = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

export const formatTime = (dateString, withSeconds = false) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (withSeconds) {
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}`;
};

export const formatRelativeTime = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30.44);
  const diffYear = Math.floor(diffDay / 365.25);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
  return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
};

export const formatDateForInput = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const isValidDate = (dateString) => {
  return parseValidDate(dateString) !== null;
};

const DateFormatter = {
  formatDate,
  formatDateLong,
  formatDateWithDay,
  formatDateSlash,
  formatDateDash,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatDateForInput,
  isValidDate,
};

export default DateFormatter;
