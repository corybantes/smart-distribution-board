import { getDateRanges } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

export interface DateRangeOption {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

export default function RangeSwitcher({
  setSelectedRange,
}: {
  setSelectedRange: (range: DateRangeOption) => void;
}) {
  const dateItems: DateRangeOption[] = getDateRanges();

  const handleRangeChange = (value: string) => {
    const selectedItem = dateItems.find((item) => item.value === value);
    if (selectedItem) {
      setSelectedRange(selectedItem);
    }
  };

  return (
    <Select defaultValue="today" onValueChange={handleRangeChange}>
      <SelectTrigger className="w-45 bg-white dark:bg-slate-900">
        <SelectValue placeholder="Select View" />
      </SelectTrigger>
      <SelectContent>
        {dateItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
