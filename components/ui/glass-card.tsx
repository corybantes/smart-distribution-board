import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, onClick, ...props }: GlassCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn("glass-card p-6 flex flex-col justify-between relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}