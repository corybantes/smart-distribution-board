import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

export default function OutletSwitcher({
  outlets,
  selectedOutlet,
  setSelectedOutlet,
}: {
  outlets: any;
  selectedOutlet: string;
  setSelectedOutlet: any;
}) {
  return (
    <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
      <SelectTrigger className="w-45 bg-white dark:bg-slate-900">
        <SelectValue placeholder="Select View" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="total">Total Building</SelectItem>
        {outlets?.map((outlet: any) => (
          <SelectItem key={outlet.id} value={outlet.id}>
            {outlet.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
