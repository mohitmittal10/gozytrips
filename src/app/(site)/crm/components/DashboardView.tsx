import React from "react";
import { useMemo } from "react";
import { getCurrencySymbol, formatCurrencyCompact } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { 
    Users, MapPin, TrendingUp, CheckCircle2, UserPlus, 
    Plane, DollarSign, CalendarDays,
    Activity, TrendingUp as TrendingUpIcon, Clock, User, ArrowDown,
    LayoutDashboard, Target, Briefcase
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
    /** Tailwind gradient class for the card hover overlay */
    color: string;
    /** Explicit Tailwind bg class for the icon container */
    iconBg: string;
    /** Explicit Tailwind text class for the icon */
    iconColor: string;
    loading?: boolean;
    badge?: string;
}

const MetricCard = ({ title, value, subtext, icon: Icon, color, iconBg, iconColor, loading, badge }: MetricCardProps) => (
    <div className="glass-main border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", color)} />
        <div className="flex items-center justify-between relative z-10">
            <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{title}</p>
                    {badge && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-indigo-500/30 text-indigo-400 h-4 shrink-0 font-bold bg-indigo-500/5">
                            {badge}
                        </Badge>
                    )}
                </div>
                <p className="text-2xl font-black text-white tracking-tighter">{loading ? (
                    <span className="inline-block w-16 h-7 bg-white/10 rounded animate-pulse" />
                ) : value}</p>
                {subtext && <p className="text-[11px] text-zinc-500 mt-1 truncate font-medium">{subtext}</p>}
            </div>
            <div className={cn("p-2.5 rounded-xl shrink-0 border border-white/5 shadow-inner", iconBg)}>
                <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
        </div>
    </div>
);


interface DashboardViewProps {
    clients: any[];
    clientsLoading: boolean;
    isComputing: boolean;
    enrichedClients: any[];
    itineraryStatuses: any[];
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
    agencySettings?: any;
    handleOpenActivitySheet: () => void;
}

export const DashboardView = (props: DashboardViewProps) => {
    const {
        clients, clientsLoading, isComputing, enrichedClients = [], itineraryStatuses = [],
        activeTripsCount, bookingsCount,
        conversionRate, bookedCount, totalProposals, bookedRevenue, standaloneRevenue,
        newClientsThisMonth, repeatClientStats, avgBookedTripValue, blendedMarginPct,
        packageVsStandaloneMix, departureCalendarStats, topDestinationsChart,
        seasonalityChart, durationBucketsChart, durationMax, revenueByMonth,
        recentActivity = [], unreadActivitiesCount = 0, agencySettings, handleOpenActivitySheet
    } = props;

    // Pipeline funnel data
    const pipelineFunnel = useMemo(() => {
        const funnel: Record<string, { stage: string, count: number, color: string }> = {};
        
        // Refined architectural gradients for core statuses
        const defaultGradients: Record<string, string> = {
            draft: 'from-zinc-500 to-zinc-600',
            proposed: 'from-indigo-400 to-indigo-600',
            sent: 'from-indigo-600 to-violet-700',
            booked: 'from-emerald-400 to-emerald-600',
            completed: 'from-cyan-400 to-cyan-600',
            rejected: 'from-rose-500 to-rose-700'
        };

        if (itineraryStatuses.length > 0) {
            itineraryStatuses.forEach(opt => {
                funnel[opt.value] = {
                    stage: opt.label,
                    count: 0,
                    color: opt.metadata?.gradient || defaultGradients[opt.value] || 'from-zinc-700 to-zinc-800'
                };
            });
        } else {
            ['draft', 'proposed', 'sent', 'booked', 'completed'].forEach(s => {
                funnel[s] = { 
                    stage: s.charAt(0).toUpperCase() + s.slice(1), 
                    count: 0, 
                    color: defaultGradients[s] 
                };
            });
        }

        enrichedClients.forEach(c => {
            if (!c.allTrips) return;
            c.allTrips.forEach((t: any) => {
                let s = (t.status || '').toLowerCase();
                if (s === 'confirmed') s = 'booked';
                if (funnel[s]) {
                    funnel[s].count++;
                }
            });
        });

        const total = Object.values(funnel).reduce((a, b) => a + b.count, 0) || 1;
        return Object.values(funnel).map(item => ({
            ...item,
            pct: Math.round((item.count / total) * 100)
        }));
    }, [enrichedClients, itineraryStatuses]);

    const totalBookedRevenue = bookedRevenue + (standaloneRevenue || 0);

    const formatCurrency = (val: number) => {
        return formatCurrencyCompact(val, agencySettings?.default_currency || DEFAULT_CURRENCY);
    };

    return (
        <div className="space-y-6">
            {/* Metric Cards Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                    title="Total Clients"
                    value={clients.length}
                    loading={clientsLoading}
                    icon={Users}
                    color="from-indigo-500/5"
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-400"
                />
                <MetricCard 
                    title="Active Trips"
                    value={activeTripsCount}
                    loading={isComputing}
                    badge={`${bookingsCount} Bookings`}
                    icon={Target}
                    color="from-indigo-500/5"
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-400"
                />
                <MetricCard 
                    title="Conversion Rate"
                    value={`${conversionRate.toFixed(1)}%`}
                    loading={isComputing}
                    subtext={`${bookedCount}/${totalProposals} proposals`}
                    icon={TrendingUp}
                    color="from-emerald-500/5"
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-400"
                />
                <MetricCard 
                    title="Booked Revenue"
                    value={formatCurrency(totalBookedRevenue)}
                    loading={isComputing}
                    subtext="Incl. Standalone Bookings"
                    icon={CheckCircle2}
                    color="from-emerald-500/5"
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-400"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                    title="New Clients (month)"
                    value={newClientsThisMonth}
                    loading={clientsLoading}
                    subtext="Created this calendar month"
                    icon={UserPlus}
                    color="from-indigo-500/5"
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-400"
                />
                <MetricCard 
                    title="Repeat Clients"
                    value={`${repeatClientStats.pct}%`}
                    loading={isComputing}
                    subtext={`${repeatClientStats.repeat} with 2+ trips/bookings`}
                    icon={Briefcase}
                    color="from-indigo-500/5"
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-400"
                />
                <MetricCard 
                    title="Avg Package Trip"
                    value={formatCurrency(avgBookedTripValue)}
                    loading={isComputing}
                    subtext="Booked and confirmed itineraries"
                    icon={Plane}
                    color="from-indigo-500/5"
                    iconBg="bg-indigo-500/10"
                    iconColor="text-indigo-400"
                />
                <MetricCard 
                    title="Est. Markup %"
                    value={blendedMarginPct == null ? "—" : `${blendedMarginPct}%`}
                    loading={isComputing}
                    subtext="Blended average across all business"
                    icon={DollarSign}
                    color="from-emerald-500/5"
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-400"
                />
            </div>

            {/* Business Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="glass-main border-white/10 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-white text-[11px] flex items-center gap-2 font-bold uppercase tracking-widest">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            Revenue Pipeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueByMonth || []}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="month" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `${getCurrencySymbol(agencySettings?.default_currency || DEFAULT_CURRENCY)}${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-main border-white/10 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-white text-[11px] flex items-center gap-2 font-bold uppercase tracking-widest">
                            <LayoutDashboard className="w-4 h-4 text-indigo-400" /> Revenue Mix
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 py-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-medium">Packages</span>
                                <span className="text-white font-bold">{formatCurrency(packageVsStandaloneMix.packageRev)} ({packageVsStandaloneMix.packagePct}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.2)]" style={{ width: `${packageVsStandaloneMix.packagePct}%` }} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-medium">Standalone</span>
                                <span className="text-white font-bold">{formatCurrency(packageVsStandaloneMix.standaloneRev)} ({packageVsStandaloneMix.standalonePct}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-zinc-400 to-zinc-500" style={{ width: `${packageVsStandaloneMix.standalonePct}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline Funnel + Upcoming Departures Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="glass-main border-white/10 lg:col-span-2 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-white text-[11px] flex items-center gap-2 font-bold uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4 text-indigo-400" /> Pipeline Funnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pipelineFunnel.map((stage, i) => (
                            <div key={stage.stage} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-300">{stage.stage}</span>
                                        <span className="text-[10px] text-zinc-500 font-medium">{stage.pct}%</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{stage.count}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-700 shadow-sm`}
                                        style={{ width: `${Math.max(stage.pct, stage.count > 0 ? 4 : 0)}%` }}
                                    />
                                </div>
                                {i < pipelineFunnel.length - 1 && (
                                    <div className="flex justify-center opacity-20">
                                        <ArrowDown className="w-3 h-3 text-zinc-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass-main border-white/10 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-white text-[11px] flex items-center gap-2 font-bold uppercase tracking-widest">
                            <CalendarDays className="w-4 h-4 text-indigo-400" /> Upcoming Departures
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center group hover:border-indigo-500/20 transition-all">
                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">This Month</p>
                                <p className="text-3xl font-black text-white tracking-tighter">{departureCalendarStats.thisMonth}</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center group hover:border-indigo-500/20 transition-all">
                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Next Month</p>
                                <p className="text-3xl font-black text-white tracking-tighter">{departureCalendarStats.nextMonth}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Seasonality</p>
                            <div className="h-[130px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={seasonalityChart}>
                                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                        />
                                        <Bar dataKey="trips" radius={[4, 4, 0, 0]} barSize={16} fill="#6366f1" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="glass-main border-white/10 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-[11px] flex items-center gap-2 font-bold uppercase tracking-widest">
                        <Activity className="w-4 h-4 text-indigo-400" /> Recent Activity
                        {unreadActivitiesCount > 0 && (
                            <span className="ml-2 text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                                {unreadActivitiesCount} new
                            </span>
                        )}
                    </CardTitle>
                    {handleOpenActivitySheet && (
                        <button onClick={handleOpenActivitySheet} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                            View All
                        </button>
                    )}
                </CardHeader>
                <CardContent>
                    {recentActivity.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8">No recent activity</p>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {recentActivity.slice(0, 10).map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                                    <div className={`p-2 rounded-xl shrink-0 border border-white/5 ${
                                        activity.type === 'client_added' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
                                    }`}>
                                        {activity.icon === 'user' ? (
                                            <User className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Plane className="w-3.5 h-3.5 text-indigo-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] text-zinc-200 font-medium truncate">{activity.label}</p>
                                        <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-1 font-medium">
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

