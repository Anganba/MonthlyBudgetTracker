import { Card, CardContent } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string;
    trend: string; // e.g., "+20%" or "-5%"
    trendUp?: boolean; // true for green, false for red
    data?: { value: number }[]; // Data for sparkline
    className?: string;
}

export function MetricCard({ title, value, trend, trendUp, data, className }: MetricCardProps) {
    // Default dummy data if none provided
    const chartData = data || [
        { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 },
        { value: 18 }, { value: 25 }, { value: 22 }, { value: 30 }
    ];

    return (
        <Card className={cn("overflow-hidden border-0 bg-card shadow-lg relative", className)}>
            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">This month</span>
                        {/* Simple dropdown icon could go here */}
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    {trendUp ? (
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={cn("text-sm font-medium", trendUp ? "text-primary" : "text-red-500")}>
                        {trend}
                    </span>
                </div>
            </CardContent>

            {/* Sparkline Background */}
            <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={trendUp !== false ? "hsl(var(--primary))" : "#ef4444"} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={trendUp !== false ? "hsl(var(--primary))" : "#ef4444"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={trendUp !== false ? "hsl(var(--primary))" : "#ef4444"}
                            fill={`url(#gradient-${title})`}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
