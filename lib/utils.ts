import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface UserProfile {
  role: "admin" | "tenant";
  firstName: string;
  city: string;
  smartDbId?: string;
  outletId?: string; // e.g., "1"
  location?: { lat: number; lon: number };
}

export interface OutletData {
  id: string;
  name: string;
  status: number; // 0=Off, 1=On, 2=Tripped
  voltage: number;
  current: number;
  power: number;
  powerFactor: number;
}

export interface EnergyApiResponse {
  temperature: number;
  buzzer: number;
  outlets: OutletData[];
  timestamp: number;
}

export interface HistoryData {
  date: string;
  current: number;
  reactivePower: number;
  realPower: number;
  usage: number;
  voltage: number;
}

export interface HistoryApiResponse {
  data: HistoryData[];
  totalConsumption: number;
}

export interface HistoryChartData {
  date: string; // e.g., "Jan 01" or ISO string
  realPower: number; // Watts
  reactivePower: number; // VAR
  voltage: number; // Volts
  current: number; // Amps
}

export interface Outlet {
  id: string; // MAC/Device ID
  name: string;
  assignedEmail: string;
  billingEnabled: boolean;
  unitLimit: number;
  currentUsage: number;
  status: "active" | "cutoff";
  priority: number;
}

export interface SystemConfig {
  mode: "single" | "multi";
  globalBillingEnabled: boolean;
  maxLoadLimit: number;
  buzzerEnabled: boolean;
  pricePerKwh: number;
}

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

import {
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  isSameDay,
  isSameHour,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";

export const fillDataGaps = (
  rawData: HistoryData[],
  rangeCode: string,
  startDate: string,
  endDate: string
) => {
  if (!startDate || !endDate) return [];

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // 1. Decide Interval: Hourly for "Today/Yesterday", Daily for everything else
  const isHourly = rangeCode === "today" || rangeCode === "yesterday";

  const intervals = isHourly
    ? eachHourOfInterval({ start, end })
    : eachDayOfInterval({ start, end });

  // 2. Map over every expected time slot
  return intervals.map((intervalDate) => {
    // Find if we have data for this specific slot
    const found = rawData?.find((item) => {
      const itemDate = parseISO(item.date); // Assuming API returns ISO string in 'date' or 'timestamp'
      return isHourly
        ? isSameHour(intervalDate, itemDate)
        : isSameDay(intervalDate, itemDate);
    });

    if (found) return found;

    // 3. If no data, return a "Zero" object
    return {
      date: intervalDate.toISOString(),
      // Format label for X-Axis based on interval
      label: format(intervalDate, isHourly ? "HH:mm" : "MMM dd"),
      realPower: 0,
      reactivePower: 0,
      voltage: 0,
      current: 0,
      usage: 0,
    };
  });
};

export const fillDataGapsNew = (
  rawData: HistoryData[],
  rangeCode: string,
  startDate: string,
  endDate: string
) => {
  if (!startDate || !endDate) return [];

  // 1. Safe Date Parsing (Force Local Timezone consistency)
  const start = startOfDay(parseISO(startDate));
  const end = endOfDay(parseISO(endDate));

  const isHourly = rangeCode === "today" || rangeCode === "yesterday";

  // 2. Generate the "Skeleton" Timeline (The empty slots)
  const intervals = isHourly
    ? eachHourOfInterval({ start, end })
    : eachDayOfInterval({ start, end });

  // 3. Create a "Lookup Map" for fast, fuzzy matching
  // Key format: "YYYY-MM-DD-HH" (Hourly) or "YYYY-MM-DD" (Daily)
  const dataMap = new Map();

  rawData?.forEach((item) => {
    // Parse the API date string
    const itemDate = parseISO(item.date);

    // Create a key based on the interval type
    // e.g., if item is 14:15, key becomes "2026-01-07-14" so it fits in the 14:00 slot
    const key = format(itemDate, isHourly ? "yyyy-MM-dd-HH" : "yyyy-MM-dd");

    // If multiple data points exist for one hour/day, we keep the last one (or you could sum them)
    dataMap.set(key, item);
  });

  // 4. Merge Timeline with Map
  return intervals.map((intervalDate) => {
    // Generate the key for this specific empty slot
    const key = format(intervalDate, isHourly ? "yyyy-MM-dd-HH" : "yyyy-MM-dd");

    // Check if we have data for this key
    const found = dataMap.get(key);

    if (found) {
      // Use the actual data, but ensure the "label" matches the chart's expectation
      return {
        ...found,
        label: format(intervalDate, isHourly ? "HH:mm" : "MMM dd"),
      };
    }

    // No data found? Return Zero entry
    return {
      date: intervalDate.toISOString(),
      label: format(intervalDate, isHourly ? "HH:mm" : "MMM dd"),
      realPower: 0,
      reactivePower: 0,
      voltage: 0,
      current: 0,
      usage: 0,
    };
  });
};
