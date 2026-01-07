import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns";

export const fmt = (date: Date) => date.toISOString().split("T")[0];

export const getDateRanges = () => {
  const now = new Date();
  return [
    {
      label: "Today",
      value: "today",
      startDate: fmt(startOfDay(now)),
      endDate: fmt(endOfDay(now)),
    },
    {
      label: "Yesterday",
      value: "yesterday",
      startDate: fmt(startOfDay(subDays(now, 1))),
      endDate: fmt(endOfDay(subDays(now, 1))),
    },
    {
      label: "Last 7 Days",
      value: "7d",
      startDate: fmt(subDays(now, 7)),
      endDate: fmt(endOfDay(now)),
    },
    {
      label: "Last 30 Days",
      value: "30d",
      startDate: fmt(subDays(now, 30)),
      endDate: fmt(endOfDay(now)),
    },
    {
      label: "This Month",
      value: "this_month",
      startDate: fmt(startOfMonth(now)),
      endDate: fmt(endOfMonth(now)),
    },
    {
      label: "Last Month",
      value: "last_month",
      startDate: fmt(startOfMonth(subMonths(now, 1))),
      endDate: fmt(endOfMonth(subMonths(now, 1))),
    },
    {
      label: "This Quarter",
      value: "this_quarter",
      startDate: fmt(startOfQuarter(now)),
      endDate: fmt(endOfQuarter(now)),
    },
    {
      label: "This Year",
      value: "this_year",
      startDate: fmt(startOfYear(now)),
      endDate: fmt(endOfYear(now)),
    },
  ];
};
