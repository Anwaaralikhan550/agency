import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  iconColor: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconColor,
  className,
}: StatsCardProps) {
  const changeColorClass = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-amber-600",
  }[changeType];

  const changeIcon = {
    positive: "fas fa-arrow-up",
    negative: "fas fa-arrow-down",
    neutral: "fas fa-exclamation-triangle",
  }[changeType];

  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 hover:transform hover:-translate-y-1",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium" data-testid={`stats-title-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </p>
          {change && (
            <p className={cn("text-sm mt-1", changeColorClass)} data-testid={`stats-change-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              <i className={`${changeIcon} mr-1`}></i>
              {change}
            </p>
          )}
        </div>
        <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", iconColor)}>
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
}
