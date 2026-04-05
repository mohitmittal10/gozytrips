import React from "react";
import { useMemo } from "react";
import { 
    Users, MapPin, TrendingUp, CheckCircle2, UserPlus, 
    Plane, DollarSign, CalendarDays,
    Activity, TrendingUp as TrendingUpIcon, Clock, User, ArrowDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle
} from "@/components/ui/card";
import { 
    BarChart as RechartsBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from "recharts";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: any;
    color: string;
    loading?: boolean;
    badge?: string;
}

const MetricCard = ({ title, value, subtext, icon: Icon, color, loading, badge }: MetricCardProps) => (
    <div className="glass-main border border-white/10 rounded-xl p-3 relative overflow-hidden group">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", color)} />
        <div className="flex items-center justify-between relative z-10">
            <div>
                <div className="flex items-center gap-1">
                    <p className="text-xs text-gray-400 font-medium">{title}</p>
                    {badge && (
                        <Badge variant="outline" className="text-[9px] px-0.5 py-0 border-blue-500/30 text-blue-400 h-4">
                            {badge}
                        </Badge>
                    )}
                </div>
                <p className="text-xl font-bold mt-0.5">{loading ? "..." : value}</p>
                {subtext && <p className="text-[11px] text-gray-500 mt-0.5">{subtext}</p>}
            </div>
            <div className={cn("p-2 rounded-lg bg-opacity-20", color.replace('from-', 'bg-').split('/')[0])}>
                <Icon className={cn("w-4 h-4", color.replace('from-', 'text-').split('/')[0])} />
            </div>
        </div>
    </div>
);

interface DashboardViewProps {
    clients: any[];
    clientsLoading: boolean;
    isComputing: boolean;
    enrichedClients: any[];
    activeTripsCount: number;
    bookingsCount: number;
    conversionRate: number;
    bookedCount: number;
    totalProposals: number;
    bookedRevenue: number;
    standaloneRevenue: number;
    newClientsThisMonth: number;
    repeatClientStats: { repeat: number; pct: number };
    avgBookedTripValue: number;
    blendedMarginPct: number | null;
    packageVsStandaloneMix: {
        packageRev: number;
        standaloneRev: number;
        packagePct: number;
        standalonePct: number;
    };
    departureCalendarStats: {
        thisMonth: number;
        nextMonth: number;
    };
    topDestinationsChart: any[];
    seasonalityChart: any[];
    durationBucketsChart: any[];
    durationMax: number;
    bookings: any[];
    revenueByMonth: any[];
    recentActivity: any[];
    unreadActivitiesCount: number;
    handleOpenActivitySheet: () => void;
}

export const DashboardView = (props: DashboardViewProps) => {
    const {
        clients, clientsLoading, isComputing, enrichedClients = [], activeTripsCount, bookingsCount,
        conversionRate, bookedCount, totalProposals, bookedRevenue, standaloneRevenue,
        newClientsThisMonth, repeatClientStats, avgBookedTripValue, blendedMarginPct,
        packageVsStandaloneMix, departureCalendarStats, topDestinationsChart,
        seasonalityChart, durationBucketsChart, durationMax, revenueByMonth,
        recentActivity = [], unreadActivitiesCount = 0, handleOpenActivitySheet
    } = props;

    // Pipeline funnel data
    const pipelineFunnel = useMemo(() => {
        const statusCounts: Record<string, number> = { draft: 0, proposed: 0, sent: 0, booked: 0, completed: 0 };
        enrichedClients.forEach(c => {
            if (!c.allTrips) return;
            c.allTrips.forEach((t: any) => {
                const s = (t.status || '').toLowerCase();
                if (s === 'confirmed') statusCounts['booked']++;
                else if (statusCounts[s] !== undefined) statusCounts[s]++;
            });
        });
        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
        return [
            { stage: 'Draft', count: statusCounts.draft, pct: Math.round((statusCounts.draft / total) * 100), color: 'from-purple-500 to-violet-500' },
            { stage: 'Proposed', count: statusCounts.proposed, pct: Math.round((statusCounts.proposed / total) * 100), color: 'from-pink-500 to-rose-500' },
            { stage: 'Sent', count: statusCounts.sent, pct: Math.round((statusCounts.sent / total) * 100), color: 'from-blue-500 to-cyan-500' },
            { stage: 'Booked', count: statusCounts.booked, pct: Math.round((statusCounts.booked / total) * 100), color: 'from-green-500 to-emerald-500' },
            { stage: 'Completed', count: statusCounts.completed, pct: Math.round((statusCounts.completed / total) * 100), color: 'from-amber-500 to-yellow-500' },
        ];
    }, [enrichedClients]);

    const totalBookedRevenue = bookedRevenue + (standaloneRevenue || 0);

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
        return `₹${Math.round(val).toLocaleString()}`;
    };

    return (
        <div className="space-y-6 mt-4">
            {/* Metric Cards Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                    title="Total Clients"
                    value={clients.length}
                    loading={clientsLoading}
                    icon={Users}
                    color="from-purple-500/10"
                />
                <MetricCard 
                    title="Active Trips"
                    value={activeTripsCount}
                    loading={isComputing}
                    badge={`${bookingsCount} Bookings`}
                    icon={MapPin}
                    color="from-blue-500/10"
                />
                <MetricCard 
                    title="Conversion Rate"
                    value={`${conversionRate.toFixed(1)}%`}
                    loading={isComputing}
                    subtext={`${bookedCount}/${totalProposals} proposals`}
                    icon={TrendingUp}
                    color="from-emerald-500/10"
                />
                <MetricCard 
                    title="Booked Revenue"
                    value={formatCurrency(totalBookedRevenue)}
                    loading={isComputing}
                    subtext="Incl. Standalone Bookings"
                    icon={CheckCircle2}
                    color="from-green-500/10"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                    title="New Clients (month)"
                    value={newClientsThisMonth}
                    loading={clientsLoading}
                    subtext="Created this calendar month"
                    icon={UserPlus}
                    color="from-cyan-500/10"
                />
                <MetricCard 
                    title="Repeat Clients"
                    value={`${repeatClientStats.pct}%`}
                    loading={isComputing}
                    subtext={`${repeatClientStats.repeat} with 2+ trips/bookings`}
                    icon={Users}
                    color="from-rose-500/10"
                />
                <MetricCard 
                    title="Avg Package Trip"
                    value={formatCurrency(avgBookedTripValue)}
                    loading={isComputing}
                    subtext="Booked and confirmed itineraries"
                    icon={Plane}
                    color="from-indigo-500/10"
                />
                <MetricCard 
                    title="Est. Markup %"
                    value={blendedMarginPct == null ? "—" : `${blendedMarginPct}%`}
                    loading={isComputing}
                    subtext="Blended average across all business"
                    icon={DollarSign}
                    color="from-emerald-500/10"
                />
            </div>

            {/* Business Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="glass-main border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2 font-semibold">
                            <Activity className="w-4 h-4 text-purple-400" />
                            Revenue Pipeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueByMonth || []}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-main border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2 font-semibold">
                            <Activity className="w-4 h-4 text-amber-400" /> Revenue Mix
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Packages</span>
                                <span className="text-white font-medium">{formatCurrency(packageVsStandaloneMix.packageRev)} ({packageVsStandaloneMix.packagePct}%)</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${packageVsStandaloneMix.packagePct}%` }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Standalone</span>
                                <span className="text-white font-medium">{formatCurrency(packageVsStandaloneMix.standaloneRev)} ({packageVsStandaloneMix.standalonePct}%)</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${packageVsStandaloneMix.standalonePct}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline Funnel + Upcoming Departures Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="glass-main border-white/10 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2 font-semibold">
                            <TrendingUp className="w-4 h-4 text-purple-400" /> Pipeline Funnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pipelineFunnel.map((stage, i) => (
                            <div key={stage.stage} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-300">{stage.stage}</span>
                                        <span className="text-[10px] text-gray-500">{stage.pct}%</span>
                                    </div>
                                    <span className="text-sm font-bold text-white">{stage.count}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-700`}
                                        style={{ width: `${Math.max(stage.pct, stage.count > 0 ? 4 : 0)}%` }}
                                    />
                                </div>
                                {i < pipelineFunnel.length - 1 && (
                                    <div className="flex justify-center">
                                        <ArrowDown className="w-3 h-3 text-gray-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass-main border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2 font-semibold">
                            <CalendarDays className="w-4 h-4 text-purple-400" /> Upcoming Departures
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">This Month</p>
                                <p className="text-2xl font-bold text-white">{departureCalendarStats.thisMonth}</p>
                                <p className="text-[10px] text-gray-500 mt-1">departures</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Next Month</p>
                                <p className="text-2xl font-bold text-white">{departureCalendarStats.nextMonth}</p>
                                <p className="text-[10px] text-gray-500 mt-1">departures</p>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-white/5 space-y-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Seasonality</p>
                            <div className="h-[130px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={seasonalityChart}>
                                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
                                        />
                                        <Bar dataKey="trips" radius={[2, 2, 0, 0]} barSize={14} fill="#8b5cf6" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lower Charts Row: Top Destinations + Duration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="glass-main border-white/10 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2 font-semibold">
                            <MapPin className="w-4 h-4 text-purple-400" /> Top Destinations (Booked)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        {topDestinationsChart.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                No booked trips yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={topDestinationsChart} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                                        {topDestinationsChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#8b5cf6'} />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-main border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2 font-semibold">
                            <TrendingUpIcon className="w-4 h-4 text-emerald-400" /> Duration Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {durationBucketsChart.map((bucket, index) => {
                            const pct = Math.min(100, (bucket.count / (durationMax || 1)) * 100);
                            return (
                                <div key={`bucket-${bucket.range || index}`} className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">{bucket.range}</span>
                                        <span className="text-gray-500">{bucket.count} trips</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="glass-main border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-sm flex items-center gap-2 font-semibold">
                        <Activity className="w-4 h-4 text-blue-400" /> Recent Activity
                        {unreadActivitiesCount > 0 && (
                            <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                {unreadActivitiesCount} new
                            </span>
                        )}
                    </CardTitle>
                    {handleOpenActivitySheet && (
                        <button onClick={handleOpenActivitySheet} className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
                            View All
                        </button>
                    )}
                </CardHeader>
                <CardContent>
                    {recentActivity.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {recentActivity.slice(0, 10).map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                        activity.type === 'client_added' ? 'bg-green-500/10' : 'bg-blue-500/10'
                                    }`}>
                                        {activity.icon === 'user' ? (
                                            <User className="w-3.5 h-3.5 text-green-400" />
                                        ) : (
                                            <Plane className="w-3.5 h-3.5 text-blue-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-300 truncate">{activity.label}</p>
                                        <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            {activity.time instanceof Date ? activity.time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
