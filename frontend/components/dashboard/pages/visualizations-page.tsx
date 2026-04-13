'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/app-store';

export function VisualizationsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const { dataLoaded, barData, lineData, pieData, csvHeaders, uploadedFile, setActivePage } = useAppStore();

  const numCols = useMemo(() => csvHeaders.filter((h) => h.type === 'number'), [csvHeaders]);
  const strCols = useMemo(() => csvHeaders.filter((h) => h.type === 'string'), [csvHeaders]);
  const labelCol = strCols[0]?.name || null;

  const firstNum = numCols[0]?.name || 'value';
  const secondNum = numCols[1]?.name || '';

  const barConfig: Record<string, { label: string; color: string }> = {};
  if (numCols.length >= 1) barConfig[firstNum] = { label: firstNum, color: '#505081' };
  if (numCols.length >= 2) barConfig[secondNum] = { label: secondNum, color: '#6B6BA8' };

  const lineConfig: Record<string, { label: string; color: string }> = {};
  if (numCols.length >= 1) lineConfig[firstNum] = { label: firstNum, color: '#505081' };
  if (numCols.length >= 2) lineConfig[secondNum] = { label: secondNum, color: '#6B6BA8' };
  if (numCols.length >= 3) lineConfig[numCols[2].name] = { label: numCols[2].name, color: '#8F8FC1' };

  const pieConfig: Record<string, { label: string; color: string }> = {};
  pieData.forEach((d) => {
    pieConfig[d.name] = { label: d.name, color: d.color };
  });

  const formatY = (v: number) => {
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return String(v);
  };

  const filterOptions = useMemo(() => {
    const opts = [{ id: 'all', label: 'All' }];
    if (barData.length > 0) opts.push({ id: 'bar', label: 'Bar' });
    if (lineData.length > 0) opts.push({ id: 'line', label: 'Trend' });
    if (pieData.length > 0) opts.push({ id: 'pie', label: 'Share' });
    if (numCols.length >= 2) opts.push({ id: 'compare', label: 'Compare' });
    return opts;
  }, [barData.length, lineData.length, pieData.length, numCols.length]);

  const show = (id: string) => activeFilter === 'all' || activeFilter === id;
  const hasData = barData.length > 0 || lineData.length > 0 || pieData.length > 0;

  return (
    <div className="space-y-5">
      {/* Header row with filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in-up">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visualizations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dataLoaded
              ? `${uploadedFile?.name || 'Dataset'} · ${barData.length + lineData.length} data points`
              : 'No data loaded'}
          </p>
        </div>
        {dataLoaded && filterOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border border-border/50">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveFilter(opt.id)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all duration-150',
                    activeFilter === opt.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!dataLoaded && (
        <div className="rounded-xl border border-border bg-card px-6 py-12 animate-fade-in-up animate-delay-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
              <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">No data to visualize</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload a CSV file to generate charts automatically.</p>
            </div>
            <Button
              size="sm"
              className="rounded-lg bg-accent-purple hover:bg-accent-purple-hover text-white text-xs h-8 shrink-0"
              onClick={() => setActivePage('upload')}
            >
              Upload <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {dataLoaded && hasData && (
        <div className="space-y-4">
          {/* ── ASYMMETRIC GRID: Big bar chart (left 60%) + Pie (right 40%) ── */}
          {show('bar') && barData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Big bar chart */}
              <Card className="lg:col-span-3 border-0 shadow-sm group hover:shadow-md transition-shadow duration-300 animate-fade-in-up animate-delay-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple-soft">
                        <BarChart3 className="h-3.5 w-3.5 text-accent-purple" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {labelCol ? `${firstNum} by ${labelCol}` : 'Data Distribution'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {numCols.length >= 2 ? `${firstNum} vs ${secondNum}` : firstNum} · {barData.length} entries
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChartContainer config={barConfig} className="h-[300px] w-full">
                    <BarChart data={barData} barGap={4} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#5F5F5F' }}
                        dy={8}
                        interval={0}
                        angle={barData.length > 6 ? -30 : 0}
                        textAnchor={barData.length > 6 ? 'end' : 'middle'}
                        height={50}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5F5F5F' }} dx={-4} tickFormatter={formatY} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey={firstNum} fill="#505081" radius={[5, 5, 0, 0]} />
                      {numCols.length >= 2 && (
                        <Bar dataKey={secondNum} fill="#6B6BA8" radius={[5, 5, 0, 0]} />
                      )}
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Pie chart (right side) */}
              {show('pie') && pieData.length > 0 && (
                <Card className="lg:col-span-2 border-0 shadow-sm group hover:shadow-md transition-shadow duration-300 animate-fade-in-up animate-delay-200">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple-soft">
                        <PieChartIcon className="h-3.5 w-3.5 text-accent-purple" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {labelCol ? `${firstNum} Share` : 'Distribution'}
                        </h3>
                        <p className="text-xs text-muted-foreground">{pieData.length} segments</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 flex-1">
                      <div className="w-[160px] h-[160px]">
                        <ChartContainer config={pieConfig} className="h-full w-full">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 w-full">
                        {pieData.map((item) => (
                          <div key={item.name} className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1.5">
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground truncate leading-tight">{item.name}</p>
                              <p className="text-[11px] font-semibold text-foreground leading-tight">{item.value.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Line chart (full width, taller) ── */}
          {show('line') && lineData.length > 0 && (
            <Card className="border-0 shadow-sm group hover:shadow-md transition-shadow duration-300 animate-fade-in-up animate-delay-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-olive-light">
                      <TrendingUp className="h-3.5 w-3.5 text-accent-olive" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {numCols.length >= 2 ? `${firstNum} & ${secondNum} Trend` : `${firstNum} Trend`}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {lineData.length} points · {labelCol ? `labeled by ${labelCol}` : 'sequential'}
                      </p>
                    </div>
                  </div>
                </div>
                <ChartContainer config={lineConfig} className="h-[240px] w-full">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#5F5F5F' }}
                      dy={8}
                      interval={0}
                      angle={lineData.length > 8 ? -30 : 0}
                      textAnchor={lineData.length > 8 ? 'end' : 'middle'}
                      height={50}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5F5F5F' }} dx={-4} tickFormatter={formatY} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey={firstNum} stroke="#505081" strokeWidth={2.5} dot={lineData.length < 15} activeDot={{ r: 4, fill: '#505081' }} />
                    {numCols.length >= 2 && (
                      <Line type="monotone" dataKey={secondNum} stroke="#6B6BA8" strokeWidth={2.5} dot={lineData.length < 15} activeDot={{ r: 4, fill: '#6B6BA8' }} />
                    )}
                    {numCols.length >= 3 && (
                      <Line type="monotone" dataKey={numCols[2].name} stroke="#8F8FC1" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    )}
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Compare view: Two smaller charts side by side ── */}
          {show('compare') && numCols.length >= 2 && barData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm group hover:shadow-md transition-shadow duration-300 animate-fade-in-up animate-delay-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple-soft">
                      <BarChart3 className="h-3.5 w-3.5 text-accent-purple" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{firstNum} Breakdown</h3>
                      <p className="text-xs text-muted-foreground">{barData.length} entries</p>
                    </div>
                  </div>
                  <ChartContainer config={{ [firstNum]: { label: firstNum, color: '#505081' } }} className="h-[180px] w-full">
                    <BarChart data={barData} barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5F5F5F' }} dy={6} interval={0} angle={barData.length > 6 ? -30 : 0} textAnchor={barData.length > 6 ? 'end' : 'middle'} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5F5F5F' }} dx={-4} tickFormatter={formatY} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey={firstNum} fill="#505081" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm group hover:shadow-md transition-shadow duration-300 animate-fade-in-up animate-delay-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-olive-light">
                      <TrendingUp className="h-3.5 w-3.5 text-accent-olive" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{secondNum} Breakdown</h3>
                      <p className="text-xs text-muted-foreground">{labelCol || 'entries'}</p>
                    </div>
                  </div>
                  <ChartContainer config={{ [secondNum]: { label: secondNum, color: '#6B6BA8' } }} className="h-[180px] w-full">
                    <BarChart data={barData} barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5F5F5F' }} dy={6} interval={0} angle={barData.length > 6 ? -30 : 0} textAnchor={barData.length > 6 ? 'end' : 'middle'} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#5F5F5F' }} dx={-4} tickFormatter={formatY} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey={secondNum} fill="#6B6BA8" radius={[5, 5, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pie standalone if bar was filtered out */}
          {activeFilter === 'pie' && pieData.length > 0 && !show('bar') && (
            <Card className="border-0 shadow-sm group hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple-soft">
                    <PieChartIcon className="h-3.5 w-3.5 text-accent-purple" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{labelCol ? `${firstNum} by ${labelCol}` : 'Distribution'}</h3>
                    <p className="text-xs text-muted-foreground">{pieData.length} categories</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-[200px] h-[200px] shrink-0">
                    <ChartContainer config={pieConfig} className="h-full w-full">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground truncate">{item.name}</p>
                          <p className="text-xs font-semibold text-foreground">{item.value.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
