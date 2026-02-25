'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TokenStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  byModel: Record<string, any>;
  byFlow: Record<string, any>;
  records: Array<{
    id: string;
    timestamp: string;
    flowName: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  }>;
}

export default function TokenUsageDashboard() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [daysBack]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/token-stats?daysBack=${daysBack}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Token Usage Dashboard</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={daysBack === days ? 'default' : 'outline'}
              onClick={() => setDaysBack(days)}
            >
              Last {days}d
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : stats ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalCalls)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Input Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalInputTokens)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Output Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalOutputTokens)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalTokens)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCost(stats.estimatedCost)}</div>
              </CardContent>
            </Card>
          </div>

          {/* By Model */}
          {Object.keys(stats.byModel).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Usage by Model</CardTitle>
                <CardDescription>Token consumption breakdown by model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byModel).map(([model, data]) => (
                    <div key={model} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{model}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Calls</p>
                          <p className="font-semibold">{formatNumber(data.calls)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Input Tokens</p>
                          <p className="font-semibold">{formatNumber(data.inputTokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Output Tokens</p>
                          <p className="font-semibold">{formatNumber(data.outputTokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Tokens</p>
                          <p className="font-semibold">{formatNumber(data.totalTokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-semibold">{formatCost(data.cost)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Flow */}
          {Object.keys(stats.byFlow).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Usage by Flow</CardTitle>
                <CardDescription>Token consumption breakdown by AI flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byFlow).map(([flow, data]) => (
                    <div key={flow} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{flow}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Calls</p>
                          <p className="font-semibold">{formatNumber(data.calls)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Input Tokens</p>
                          <p className="font-semibold">{formatNumber(data.inputTokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Output Tokens</p>
                          <p className="font-semibold">{formatNumber(data.outputTokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Tokens</p>
                          <p className="font-semibold">{formatNumber(data.totalTokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-semibold">{formatCost(data.cost)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Records */}
          {stats.records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
                <CardDescription>Last {Math.min(stats.records.length, 100)} calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Time</th>
                        <th className="text-left py-2 px-2">Flow</th>
                        <th className="text-left py-2 px-2">Model</th>
                        <th className="text-right py-2 px-2">Input</th>
                        <th className="text-right py-2 px-2">Output</th>
                        <th className="text-right py-2 px-2">Total</th>
                        <th className="text-right py-2 px-2">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.records.map(record => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{new Date(record.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2 px-2">{record.flowName}</td>
                          <td className="py-2 px-2 text-xs">{record.model}</td>
                          <td className="text-right py-2 px-2">{formatNumber(record.inputTokens)}</td>
                          <td className="text-right py-2 px-2">{formatNumber(record.outputTokens)}</td>
                          <td className="text-right py-2 px-2 font-semibold">{formatNumber(record.totalTokens)}</td>
                          <td className="text-right py-2 px-2">{formatCost(record.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
