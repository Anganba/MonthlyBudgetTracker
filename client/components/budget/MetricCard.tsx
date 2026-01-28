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
    accentColor?: 'primary' | 'cyan' | 'rose' | 'violet';
}

const accentColorMap = {
    primary: { color: 'hsl(84, 81%, 65%)', textClass: 'text-primary' },
    cyan: { color: '#22d3ee', textClass: 'text-cyan-400' },
    rose: { color: '#fb7185', textClass: 'text-rose-400' },
    violet: { color: '#a78bfa', textClass: 'text-violet-400' },
};

export function MetricCard({ title, value, trend, trendUp, data, className, accentColor = 'primary' }: MetricCardProps) {
    // Default dummy data if none provided
    const chartData = data || [
        { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 },
        { value: 18 }, { value: 25 }, { value: 22 }, { value: 30 }
    ];

    const accent = accentColorMap[accentColor];
    const chartColor = trendUp !== false ? accent.color : '#ef4444';
    const trendTextClass = trendUp ? accent.textClass : 'text-red-500';

    return (
        <Card className={cn("overflow-hidden border bg-card shadow-lg relative group hover:scale-[1.02] transition-all duration-300", className)}>
            <CardContent className="p-4 md:p-6 relative z-10">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">{title}</p>
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{value}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground">This month</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    {trendUp ? (
                        <ArrowUpRight className={cn("w-4 h-4", accent.textClass)} />
                    ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={cn("text-xs md:text-sm font-medium", trendTextClass)}>
                        {trend}
                    </span>
                </div>
            </CardContent>

            {/* Sparkline Background with enhanced opacity */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.9} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={chartColor}
                            fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                            strokeWidth={2.5}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: `inset 0 0 30px ${accent.color}15` }} />
        </Card>
    );
}
