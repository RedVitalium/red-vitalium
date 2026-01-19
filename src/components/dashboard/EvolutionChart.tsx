import { useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Area,
  AreaChart
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataPoint {
  date: string;
  value: number;
}

interface EvolutionChartProps {
  data: DataPoint[];
  title: string;
  unit?: string;
  isLowerBetter?: boolean;
  optimalMin?: number;
  optimalMax?: number;
  warningMin?: number;
  warningMax?: number;
  showDataPoints?: boolean; // For discrete data
  color?: "success" | "warning" | "danger" | "primary";
}

const colorMap = {
  success: { stroke: "hsl(var(--success))", fill: "hsl(var(--success))" },
  warning: { stroke: "hsl(var(--warning))", fill: "hsl(var(--warning))" },
  danger: { stroke: "hsl(var(--destructive))", fill: "hsl(var(--destructive))" },
  primary: { stroke: "hsl(var(--primary))", fill: "hsl(var(--primary))" },
};

function getStatusColor(value: number, optimalMin?: number, optimalMax?: number, warningMin?: number, warningMax?: number): "success" | "warning" | "danger" {
  if (optimalMin !== undefined && optimalMax !== undefined) {
    if (value >= optimalMin && value <= optimalMax) return "success";
    if (warningMin !== undefined && warningMax !== undefined) {
      if (value >= warningMin && value <= warningMax) return "warning";
    }
    return "danger";
  }
  return "primary" as any;
}

function calculateImprovement(data: DataPoint[], isLowerBetter: boolean): { percent: number; absolute: number } | null {
  if (data.length < 2) return null;
  
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sortedData[0].value;
  const last = sortedData[sortedData.length - 1].value;
  
  if (first === 0) return null;
  
  const absolute = last - first;
  const percent = ((last - first) / Math.abs(first)) * 100;
  
  // Invert if lower is better
  return {
    percent: isLowerBetter ? -percent : percent,
    absolute: isLowerBetter ? -absolute : absolute,
  };
}

export function EvolutionChart({
  data,
  title,
  unit = "",
  isLowerBetter = false,
  optimalMin,
  optimalMax,
  warningMin,
  warningMax,
  showDataPoints = true,
  color = "primary",
}: EvolutionChartProps) {
  const formattedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedDate: format(new Date(d.date), "d MMM", { locale: es }),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const improvement = useMemo(() => calculateImprovement(data, isLowerBetter), [data, isLowerBetter]);
  
  const currentValue = data.length > 0 
    ? [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value 
    : null;

  const statusColor = currentValue !== null 
    ? getStatusColor(currentValue, optimalMin, optimalMax, warningMin, warningMax)
    : color;

  const { stroke, fill } = colorMap[statusColor] || colorMap.primary;

  if (formattedData.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
        Sin datos de evolución
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with improvement indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        {improvement && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            improvement.percent > 0 ? "text-success" : 
            improvement.percent < 0 ? "text-destructive" : 
            "text-muted-foreground"
          }`}>
            {improvement.percent > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : improvement.percent < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>
              {improvement.percent > 0 ? "+" : ""}{improvement.percent.toFixed(1)}%
              {unit && ` (${improvement.absolute > 0 ? "+" : ""}${improvement.absolute.toFixed(1)} ${unit})`}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={100}>
        {showDataPoints ? (
          <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground">{data.formattedDate}</p>
                      <p className="text-sm font-semibold">
                        {data.value} {unit}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {optimalMin !== undefined && (
              <ReferenceLine y={optimalMin} stroke="hsl(var(--success))" strokeDasharray="3 3" strokeOpacity={0.5} />
            )}
            {optimalMax !== undefined && (
              <ReferenceLine y={optimalMax} stroke="hsl(var(--success))" strokeDasharray="3 3" strokeOpacity={0.5} />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={1.5}
              dot={{ r: 4, fill: stroke, strokeWidth: 2, stroke: "hsl(var(--background))" }}
              activeDot={{ r: 6, fill: stroke }}
            />
          </LineChart>
        ) : (
          <AreaChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={`gradient-evolution-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fill} stopOpacity={0.3} />
                <stop offset="100%" stopColor={fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground">{data.formattedDate}</p>
                      <p className="text-sm font-semibold">
                        {data.value} {unit}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#gradient-evolution-${title})`}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Traffic light indicator */}
      {currentValue !== null && optimalMin !== undefined && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            statusColor === "success" ? "bg-success" :
            statusColor === "warning" ? "bg-warning" :
            "bg-destructive"
          }`} />
          <span className="text-xs text-muted-foreground">
            Valor actual: <span className="font-medium">{currentValue} {unit}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for cards
export function MiniEvolutionChart({
  data,
  color = "primary",
  showImprovement = true,
  isLowerBetter = false,
  unit = "",
}: {
  data: { value: number; date?: string }[];
  color?: "success" | "warning" | "danger" | "primary";
  showImprovement?: boolean;
  isLowerBetter?: boolean;
  unit?: string;
}) {
  const { stroke, fill } = colorMap[color];

  const improvement = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[data.length - 1].value;
    const last = data[0].value;
    if (first === 0) return null;
    const percent = ((last - first) / Math.abs(first)) * 100;
    const absolute = last - first;
    return {
      percent: isLowerBetter ? -percent : percent,
      absolute: isLowerBetter ? -absolute : absolute,
    };
  }, [data, isLowerBetter]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {showImprovement && improvement && (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          improvement.percent > 0 ? "text-success" : 
          improvement.percent < 0 ? "text-destructive" : 
          "text-muted-foreground"
        }`}>
          {improvement.percent > 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : improvement.percent < 0 ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          <span>
            {improvement.percent > 0 ? "+" : ""}{improvement.percent.toFixed(0)}%
            {unit && ` (${improvement.absolute > 0 ? "+" : ""}${improvement.absolute.toFixed(1)} ${unit})`}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={50}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-mini-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={0.3} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#gradient-mini-${color})`}
            dot={{ r: 2, fill: stroke }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
