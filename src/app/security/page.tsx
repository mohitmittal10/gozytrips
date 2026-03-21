'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { fetchAuditLogs, type AuditLog } from '@/lib/audit-logger';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  LogIn,
  LogOut,
  Trash2,
  UserPlus,
  Download,
  Activity,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Server,
  Key,
  Database,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ACTION_ICON_MAP: Record<string, React.ReactNode> = {
  LOGIN: <LogIn className="w-4 h-4 text-green-400" />,
  LOGOUT: <LogOut className="w-4 h-4 text-gray-400" />,
  CREATE_TRIP: <FileText className="w-4 h-4 text-blue-400" />,
  DELETE_TRIP: <Trash2 className="w-4 h-4 text-red-400" />,
  STATUS_CHANGE: <Activity className="w-4 h-4 text-yellow-400" />,
  CREATE_CLIENT: <UserPlus className="w-4 h-4 text-purple-400" />,
  UPDATE_CLIENT: <Eye className="w-4 h-4 text-cyan-400" />,
  DELETE_CLIENT: <Trash2 className="w-4 h-4 text-red-400" />,
  EXPORT_CSV: <Download className="w-4 h-4 text-orange-400" />,
  EXPORT_PDF: <Download className="w-4 h-4 text-orange-400" />,
  UPDATE_PROFILE: <Eye className="w-4 h-4 text-cyan-400" />,
};

const ACTION_LABEL_MAP: Record<string, string> = {
  LOGIN: 'Sign In',
  LOGOUT: 'Sign Out',
  CREATE_TRIP: 'Trip Created',
  DELETE_TRIP: 'Trip Deleted',
  STATUS_CHANGE: 'Status Changed',
  CREATE_CLIENT: 'Client Added',
  UPDATE_CLIENT: 'Client Updated',
  DELETE_CLIENT: 'Client Deleted',
  EXPORT_CSV: 'CSV Export',
  EXPORT_PDF: 'PDF Export',
  UPDATE_PROFILE: 'Profile Updated',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function SecurityPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    loadLogs();
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    setLogsLoading(true);
    const data = await fetchAuditLogs(user.id, { limit: 100 });
    setLogs(data);
    setLogsLoading(false);
  };

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter((l) => l.action_type === filter);
  }, [logs, filter]);

  const lastLogin = useMemo(() => {
    const loginLog = logs.find((l) => l.action_type === 'LOGIN');
    return loginLog ? new Date(loginLog.created_at).toLocaleString() : 'N/A';
  }, [logs]);

  const totalActions = logs.length;
  const deletionCount = logs.filter(
    (l) => l.action_type === 'DELETE_TRIP' || l.action_type === 'DELETE_CLIENT'
  ).length;
  const exportCount = logs.filter(
    (l) => l.action_type === 'EXPORT_CSV' || l.action_type === 'EXPORT_PDF'
  ).length;

  const securityFeatures = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'AES-256 Encryption',
      description: 'All data encrypted at rest using bank-grade AES-256 standard.',
      status: 'active',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'TLS 1.3 in Transit',
      description: 'All network traffic encrypted with latest TLS 1.3 protocol.',
      status: 'active',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Row Level Security',
      description: 'Your data is isolated in a private digital vault. No other agent can access it.',
      status: 'active',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: 'Multi-Factor Auth',
      description: 'Add an extra layer of protection with a second verification step.',
      status: 'available',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Tamper-Proof Audit Logs',
      description: 'Every action is permanently recorded. Logs cannot be edited or deleted.',
      status: 'active',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      icon: <Server className="w-6 h-6" />,
      title: 'SOC 2 Infrastructure',
      description: 'Hosted on enterprise-grade cloud with SOC 2 Type II certification.',
      status: 'active',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-20 max-w-5xl">
        <Link href="/profile">
          <Button variant="ghost" className="mb-6 gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/20">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                Security & Trust Center
              </h1>
              <p className="text-gray-400 mt-1">
                Your data protection status and activity history
              </p>
            </div>
          </div>
        </div>

        {/* Security Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#111] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Security Status</p>
                  <p className="text-lg font-bold text-green-400">Protected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <LogIn className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Last Login</p>
                  <p className="text-lg font-bold text-white">{lastLogin}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tracked Actions</p>
                  <p className="text-lg font-bold text-white">{totalActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Features Grid */}
        <h2 className="text-xl font-bold mb-4 text-white">Data Protection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {securityFeatures.map((feature) => (
            <Card
              key={feature.title}
              className={`bg-[#111] border ${feature.borderColor} hover:border-opacity-50 transition-all duration-300`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${feature.bgColor} rounded-lg shrink-0 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          feature.status === 'active'
                            ? 'border-green-500/50 text-green-400'
                            : 'border-yellow-500/50 text-yellow-400'
                        }`}
                      >
                        {feature.status === 'active' ? 'Active' : 'Available'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Audit Log Feed */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-bold text-white">Activity Audit Log</h2>
          <div className="flex items-center gap-3">
            <Select defaultValue="all" onValueChange={(v) => setFilter(v)}>
              <SelectTrigger className="w-[180px] bg-[#111] border-white/10 text-white">
                <SelectValue placeholder="Filter actions" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-white/10 text-white">
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="LOGIN">Sign In</SelectItem>
                <SelectItem value="LOGOUT">Sign Out</SelectItem>
                <SelectItem value="DELETE_TRIP">Trip Deleted</SelectItem>
                <SelectItem value="DELETE_CLIENT">Client Deleted</SelectItem>
                <SelectItem value="STATUS_CHANGE">Status Changed</SelectItem>
                <SelectItem value="CREATE_CLIENT">Client Added</SelectItem>
                <SelectItem value="EXPORT_CSV">CSV Exports</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              className="border-white/10 text-gray-400 hover:text-white gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="pt-6">
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-white/5 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 bg-white/5 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No activity recorded yet.</p>
                <p className="text-xs mt-1">Actions will appear here as you use the CRM.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {ACTION_ICON_MAP[log.action_type] || (
                        <Activity className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{log.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-white/10 text-gray-500"
                        >
                          {ACTION_LABEL_MAP[log.action_type] || log.action_type}
                        </Badge>
                        {log.entity_type && (
                          <span className="text-[10px] text-gray-600">{log.entity_type}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 shrink-0">{timeAgo(log.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Promise */}
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/20 mt-10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl shrink-0">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Our Security Promise</h3>
                <ul className="space-y-1.5 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span><strong className="text-gray-200">Your data is yours</strong> — We never sell or share your client data with third parties.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span><strong className="text-gray-200">Isolated environments</strong> — Your data is mathematically separated from other agents.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span><strong className="text-gray-200">Permanent accountability</strong> — All actions are permanently logged and cannot be tampered with.</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
