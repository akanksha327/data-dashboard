'use client';

import { useMemo, type ElementType } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  MessageSquareText,
  Eye,
  Clock,
  Database,
  Columns3,
  TrendingUp,
  Activity,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/app-store';

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

export function DashboardPage() {
  const {
    uploadedFile,
    dataLoaded,
    totalQueries,
    recentActivity,
    barData,
    lineData,
    csvHeaders,
    insights,
    setActivePage,
  } = useAppStore();

  const numericColumns = useMemo(
    () => csvHeaders.filter((header) => header.type === 'number'),
    [csvHeaders]
  );

  const topMetric = useMemo(() => {
    if (!dataLoaded || numericColumns.length === 0) {
      return '-';
    }

    const columnName = numericColumns[0].name;
    const total = barData.reduce((sum, row) => sum + Number(row[columnName] || 0), 0);
    return formatNumber(total);
  }, [barData, dataLoaded, numericColumns]);

  const growthMetric = useMemo(() => insights[1]?.metric || null, [insights]);

  const topCategory = useMemo(() => {
    if (!dataLoaded || barData.length === 0) {
      return '-';
    }

    const sorted = [...barData].sort((left, right) => {
      const leftValue = Number(Object.values(left).find((value) => typeof value === 'number')) || 0;
      const rightValue = Number(Object.values(right).find((value) => typeof value === 'number')) || 0;
      return rightValue - leftValue;
    });

    return String(sorted[0]?.label ?? '-');
  }, [barData, dataLoaded]);

  const mainColumn = numericColumns[0]?.name || 'value';
  const secondColumn = numericColumns[1]?.name;

  const mainChartConfig: Record<string, { label: string; color: string }> = {
    [mainColumn]: { label: mainColumn, color: '#505081' },
  };

  if (secondColumn) {
    mainChartConfig[secondColumn] = { label: secondColumn, color: '#6B6BA8' };
  }

  const mainChartData = useMemo(() => {
    if (dataLoaded && lineData.length > 0) {
      return lineData;
    }

    return [
      { label: 'Mon', value: 3200 },
      { label: 'Tue', value: 4100 },
      { label: 'Wed', value: 3800 },
      { label: 'Thu', value: 5200 },
      { label: 'Fri', value: 4600 },
      { label: 'Sat', value: 5800 },
      { label: 'Sun', value: 6200 },
    ];
  }, [dataLoaded, lineData]);

  const visibleDataPoints = mainChartData.length;

  const stats = [
    {
      label: 'Total Rows',
      value: uploadedFile ? uploadedFile.rows.toLocaleString() : '-',
      icon: Database,
      color: 'text-accent-purple',
      bg: 'bg-accent-purple-soft',
    },
    {
      label: 'Columns',
      value: uploadedFile ? `${uploadedFile.columns}` : '-',
      icon: Columns3,
      color: 'text-accent-purple',
      bg: 'bg-accent-purple-soft',
    },
    {
      label: numericColumns[0]?.name || 'Top Metric',
      value: topMetric,
      icon: TrendingUp,
      color: 'text-accent-purple',
      bg: 'bg-accent-purple-soft',
    },
    {
      label: 'Last Updated',
      value: uploadedFile ? uploadedFile.uploadedAt : '-',
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
  ];

  const activityIconMap: Record<string, { color: string; bg: string; icon: ElementType }> = {
    upload: { color: 'text-accent-purple', bg: 'bg-accent-purple-soft', icon: Upload },
    query: { color: 'text-accent-purple', bg: 'bg-accent-purple-soft', icon: MessageSquareText },
    insight: { color: 'text-accent-slate', bg: 'bg-accent-slate-light', icon: TrendingUp },
    chart: { color: 'text-accent-slate', bg: 'bg-accent-slate-light', icon: Eye },
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group cursor-default rounded-xl border border-border bg-card px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', stat.bg)}>
                  <Icon className={cn('h-3.5 w-3.5', stat.color)} />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p className="text-lg font-bold leading-none text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {!dataLoaded && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card px-5 py-8 text-center transition-all duration-200 hover:border-accent-purple/50 hover:shadow-md">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-purple-soft">
            <Upload className="h-5 w-5 text-accent-purple" />
          </div>
          <p className="text-sm font-medium text-foreground">Upload a CSV file to get started</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The frontend and backend now run separately, so uploads go through the dedicated API-backed upload page.
          </p>
          <Button
            className="mt-4 rounded-xl bg-accent-purple text-white hover:bg-accent-purple-hover"
            onClick={() => setActivePage('upload')}
          >
            Open Upload Page
          </Button>
        </div>
      )}

      {dataLoaded && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
          <Card className="group border-0 shadow-sm transition-shadow duration-300 hover:shadow-md lg:col-span-7">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{mainColumn} Trend</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {visibleDataPoints} data points from {uploadedFile?.name || 'dataset'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setActivePage('visualizations')}
                >
                  View all <ChevronRight className="ml-0.5 h-3 w-3" />
                </Button>
              </div>
              <ChartContainer config={mainChartConfig} className="h-[260px] w-full">
                <AreaChart data={mainChartData}>
                  <defs>
                    <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#505081" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#505081" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#8A8A8A' }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#8A8A8A' }}
                    dx={-4}
                    tickFormatter={formatNumber}
                    width={50}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey={mainColumn}
                    stroke="#505081"
                    strokeWidth={2}
                    fill="url(#dashFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#505081' }}
                  />
                  {secondColumn && (
                    <Area
                      type="monotone"
                      dataKey={secondColumn}
                      stroke="#6B6BA8"
                      strokeWidth={2}
                      fill="none"
                      dot={false}
                      activeDot={{ r: 4, fill: '#6B6BA8' }}
                    />
                  )}
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 lg:col-span-3">
            <div className="group flex-1 rounded-xl border border-border bg-card px-4 py-4 transition-all duration-200 hover:shadow-md">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Current File
              </p>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-accent-purple" />
                <p className="truncate text-sm font-semibold text-foreground">{uploadedFile?.name}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {uploadedFile?.rows.toLocaleString()} rows x {uploadedFile?.columns} cols - {uploadedFile?.size}
              </p>
            </div>

            <div className="group flex-1 rounded-xl border border-border bg-card px-4 py-4 transition-all duration-200 hover:shadow-md">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Top Value
              </p>
              <p className="text-2xl font-bold leading-none text-foreground">{topCategory}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">Highest visible category in the dataset</p>
              {growthMetric && (
                <span
                  className={cn(
                    'mt-2 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                    growthMetric.startsWith('+')
                      ? 'bg-accent-purple-soft text-accent-purple'
                      : growthMetric.startsWith('-')
                        ? 'bg-accent-red-light text-accent-red'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {growthMetric.startsWith('+') && <ArrowUpRight className="h-3 w-3" />}
                  {growthMetric.startsWith('-') && <ArrowDownRight className="h-3 w-3" />}
                  {growthMetric} trend
                </span>
              )}
            </div>

            <div className="group flex-1 rounded-xl border border-border bg-card px-4 py-4 transition-all duration-200 hover:shadow-md">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Queries Run
              </p>
              <p className="text-2xl font-bold leading-none text-foreground">{totalQueries}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {totalQueries === 0 ? 'No backend queries yet' : 'Total queries in this session'}
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card px-4 py-4 transition-all duration-200 hover:shadow-md">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Activity Score
              </p>
              <ChartContainer config={{ v: { label: 'Activity', color: '#6B6BA8' } }} className="h-[60px] w-full">
                <BarChart
                  data={[
                    { label: 'Mon', v: 65 },
                    { label: 'Tue', v: 72 },
                    { label: 'Wed', v: 58 },
                    { label: 'Thu', v: 81 },
                    { label: 'Fri', v: 74 },
                    { label: 'Sat', v: 89 },
                    { label: 'Sun', v: 92 },
                  ]}
                  barSize={8}
                >
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#8A8A8A' }}
                    dy={4}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="v" fill="#6B6BA8" radius={[3, 3, 0, 0]} opacity={0.65} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      )}

      {dataLoaded && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
          <div className="group rounded-xl border border-border bg-card px-4 py-4 transition-shadow duration-300 hover:shadow-md lg:col-span-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {recentActivity.length === 0 ? (
              <div className="flex items-center gap-3 py-4">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No activity recorded. Run a query to get started.</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-border/50">
                {recentActivity.slice(0, 5).map((item) => {
                  const style = activityIconMap[item.type] || {
                    color: 'text-muted-foreground',
                    bg: 'bg-muted',
                    icon: Activity,
                  };
                  const Icon = style.icon;

                  return (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', style.bg)}>
                        <Icon className={cn('h-3.5 w-3.5', style.color)} />
                      </div>
                      <p className="flex-1 truncate text-xs text-foreground">{item.description}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{item.timestamp}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="group rounded-xl border border-border bg-card px-4 py-4 transition-shadow duration-300 hover:shadow-md">
              <h3 className="mb-2.5 text-sm font-semibold text-foreground">Columns</h3>
              <div className="flex flex-wrap gap-1.5">
                {csvHeaders.slice(0, 8).map((header) => (
                  <span
                    key={header.name}
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
                      header.type === 'number'
                        ? 'bg-accent-purple-soft text-accent-purple'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {header.type === 'number' ? '#' : 'Aa'} {header.name}
                  </span>
                ))}
                {csvHeaders.length > 8 && (
                  <span className="px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{csvHeaders.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
