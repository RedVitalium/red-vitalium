import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MiniChartProps {
  data: { value: number }[];
  color?: "success" | "warning" | "danger" | "primary";
}

const colorMap = {
  success: { stroke: "hsl(142, 71%, 45%)", fill: "hsl(142, 71%, 45%)" },
  warning: { stroke: "hsl(45, 93%, 47%)", fill: "hsl(45, 93%, 47%)" },
  danger: { stroke: "hsl(0, 84%, 60%)", fill: "hsl(0, 84%, 60%)" },
  primary: { stroke: "hsl(224, 53%, 38%)", fill: "hsl(224, 53%, 38%)" },
};

export function MiniChart({ data, color = "primary" }: MiniChartProps) {
  const { stroke, fill } = colorMap[color];

  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity={0.3} />
            <stop offset="100%" stopColor={fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
