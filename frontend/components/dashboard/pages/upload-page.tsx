'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  CheckCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
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
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { uploadDataset } from '@/lib/api';
import { useAppStore } from '@/lib/app-store';

function formatYAxis(value: number) {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return String(value);
}

export function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [localStep, setLocalStep] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    csvHeaders,
    uploadedFile,
    barData,
    lineData,
    insights,
    dataLoaded,
    setDatasetId,
    setUploadedFile,
    setIsProcessing,
    setDataLoaded,
    setChartData,
    setRawCsvData,
    setInsights,
    addActivity,
    setActivePage,
    clearChatMessages,
  } = useAppStore();

  useEffect(() => {
    setLocalStep(dataLoaded && uploadedFile ? 'done' : 'idle');
  }, [dataLoaded, uploadedFile]);

  const chartMeta = useMemo(() => {
    const numCols = csvHeaders.filter((header) => header.type === 'number');
    const strCols = csvHeaders.filter((header) => header.type === 'string');
    return {
      numCols,
      strCols,
      labelCol: strCols[0]?.name || null,
    };
  }, [csvHeaders]);

  const processFile = useCallback(
    async (file: File) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['csv', 'tsv', 'txt'].includes(extension)) {
        setLocalStep('error');
        setErrorMsg('Please upload a CSV file (.csv, .tsv, or .txt).');
        return;
      }

      try {
        setIsProcessing(true);
        setLocalStep('processing');
        setErrorMsg('');

        const response = await uploadDataset(file);

        setDatasetId(response.datasetId);
        setUploadedFile(response.uploadedFile);
        setDataLoaded(true);
        setRawCsvData([], response.headers);
        setChartData(
          response.charts.barData,
          response.charts.lineData,
          response.charts.pieData
        );
        setInsights(response.insights);
        clearChatMessages();

        addActivity({
          id: `upload-${Date.now()}`,
          type: 'upload',
          description: `Uploaded ${response.uploadedFile.name}`,
          timestamp: 'Just now',
        });
        addActivity({
          id: `chart-${Date.now()}`,
          type: 'chart',
          description: `Generated ${response.charts.barData.length + response.charts.lineData.length} chart points`,
          timestamp: 'Just now',
        });
        addActivity({
          id: `insight-${Date.now()}`,
          type: 'insight',
          description: `Generated ${response.insights.length} backend insights`,
          timestamp: 'Just now',
        });

        setLocalStep('done');
      } catch (error) {
        setLocalStep('error');
        setErrorMsg(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      addActivity,
      clearChatMessages,
      setChartData,
      setDataLoaded,
      setDatasetId,
      setInsights,
      setIsProcessing,
      setRawCsvData,
      setUploadedFile,
    ]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void processFile(file);
      }
      event.target.value = '';
    },
    [processFile]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile]
  );

  const resetUpload = useCallback(() => {
    setDatasetId(null);
    setUploadedFile(null);
    setDataLoaded(false);
    setChartData([], [], []);
    setInsights([]);
    setRawCsvData([], []);
    clearChatMessages();
    setLocalStep('idle');
    setErrorMsg('');
  }, [
    clearChatMessages,
    setChartData,
    setDataLoaded,
    setDatasetId,
    setInsights,
    setRawCsvData,
    setUploadedFile,
  ]);

  const primaryMetric = chartMeta.numCols[0]?.name || 'value1';
  const secondaryMetric = chartMeta.numCols[1]?.name || 'value2';

  const barConfig: Record<string, { label: string; color: string }> = {
    [primaryMetric]: { label: primaryMetric, color: '#505081' },
  };
  if (chartMeta.numCols.length > 1) {
    barConfig[secondaryMetric] = { label: secondaryMetric, color: '#6B6BA8' };
  }

  const lineConfig: Record<string, { label: string; color: string }> = {
    [primaryMetric]: { label: primaryMetric, color: '#505081' },
  };
  if (chartMeta.numCols.length > 1) {
    lineConfig[secondaryMetric] = { label: secondaryMetric, color: '#6B6BA8' };
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/plain,application/vnd.ms-excel"
        onChange={handleFileChange}
        className="opacity-0 absolute -z-10 w-0 h-0"
      />

      <div className="animate-fade-in-up">
        <h2 className="text-lg font-semibold text-foreground">Upload Data</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Send your CSV to the backend for parsing, chart generation, and AI-ready analysis.
        </p>
      </div>

      {localStep !== 'done' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={localStep === 'idle' ? openFilePicker : undefined}
          className={cn(
            'relative animate-fade-in-up animate-delay-100 rounded-2xl border-2 border-dashed transition-all duration-300',
            localStep === 'idle' && 'cursor-pointer',
            isDragging
              ? 'border-accent-purple bg-accent-purple/5 scale-[1.005]'
              : 'border-border bg-card hover:border-accent-purple/40 hover:shadow-sm'
          )}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            {localStep === 'processing' ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple-soft mb-4">
                  <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Uploading to backend...</p>
                <p className="text-xs text-muted-foreground">
                  Processing the CSV, generating charts, and preparing the query dataset
                </p>
                <div className="mt-6 h-1.5 w-64 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-accent-purple animate-[loading_2.5s_ease-in-out_forwards]" />
                </div>
              </>
            ) : localStep === 'error' ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-red-light mb-4">
                  <FileText className="h-8 w-8 text-accent-red" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1 text-center">{errorMsg}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Check the file format and confirm the backend is running on port 5000.
                </p>
                <Button
                  className="rounded-xl bg-accent-purple hover:bg-accent-purple-hover text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    setLocalStep('idle');
                    setErrorMsg('');
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-200',
                    isDragging ? 'bg-accent-purple-soft' : 'bg-muted'
                  )}
                >
                  <Upload
                    className={cn(
                      'h-8 w-8 transition-colors duration-200',
                      isDragging ? 'text-accent-purple' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">Drop a CSV file here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse. The backend API stores the dataset and prepares queryable metrics.
                </p>
                <Button
                  className="rounded-xl bg-accent-purple hover:bg-accent-purple-hover text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    openFilePicker();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </>
            )}
          </CardContent>
        </div>
      )}

      {localStep === 'done' && uploadedFile && (
        <>
          <Card className="border-0 shadow-sm animate-fade-in-up">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-purple-soft">
                    <CheckCircle className="h-6 w-6 text-accent-purple" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">File uploaded successfully</p>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">
                      {uploadedFile.name} · {uploadedFile.rows.toLocaleString()} rows · {uploadedFile.columns} columns · {uploadedFile.size}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    className="rounded-xl bg-accent-gray text-white hover:bg-accent-gray-hover"
                    onClick={openFilePicker}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Another File
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={resetUpload}
                  >
                    Clear Current Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {barData.length > 0 && (
            <div className="space-y-4 animate-fade-in-up animate-delay-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent-purple" />
                <h3 className="text-sm font-semibold text-foreground">Generated Charts</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                  {uploadedFile.rows.toLocaleString()} rows
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-foreground">
                        {chartMeta.labelCol
                          ? `${chartMeta.numCols[0]?.name || 'Value'} by ${chartMeta.labelCol}`
                          : 'Data Overview'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Backend-generated bar chart · {uploadedFile.rows.toLocaleString()} rows
                      </p>
                    </div>
                    <ChartContainer config={barConfig} className="h-[200px] w-full">
                      <BarChart data={barData} barGap={4} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#5F5F5F' }}
                          dy={8}
                          interval={0}
                          angle={barData.length > 6 ? -35 : 0}
                          textAnchor={barData.length > 6 ? 'end' : 'middle'}
                          height={50}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#5F5F5F' }}
                          dx={-4}
                          width={50}
                          tickFormatter={formatYAxis}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey={primaryMetric} fill="#505081" radius={[6, 6, 0, 0]} />
                        {chartMeta.numCols.length > 1 && (
                          <Bar dataKey={secondaryMetric} fill="#6B6BA8" radius={[6, 6, 0, 0]} />
                        )}
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-foreground">
                        {chartMeta.numCols.length > 1
                          ? `${chartMeta.numCols[0]?.name} & ${chartMeta.numCols[1]?.name} Trend`
                          : `${chartMeta.numCols[0]?.name || 'Value'} Trend`}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Backend-generated line chart
                      </p>
                    </div>
                    <ChartContainer config={lineConfig} className="h-[200px] w-full">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#5F5F5F' }}
                          dy={8}
                          interval={0}
                          angle={lineData.length > 8 ? -35 : 0}
                          textAnchor={lineData.length > 8 ? 'end' : 'middle'}
                          height={50}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#5F5F5F' }}
                          dx={-4}
                          width={50}
                          tickFormatter={formatYAxis}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey={primaryMetric}
                          stroke="#505081"
                          strokeWidth={2.5}
                          dot={lineData.length < 15}
                          activeDot={{ r: 5, fill: '#505081' }}
                        />
                        {chartMeta.numCols.length > 1 && (
                          <Line
                            type="monotone"
                            dataKey={secondaryMetric}
                            stroke="#6B6BA8"
                            strokeWidth={2.5}
                            dot={lineData.length < 15}
                            activeDot={{ r: 5, fill: '#6B6BA8' }}
                          />
                        )}
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {barData.length === 0 && (
            <Card className="border-0 shadow-sm animate-fade-in-up animate-delay-100">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No numeric columns detected</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  The backend accepted the file, but it only found text columns. Charts need at least one numeric field.
                </p>
              </CardContent>
            </Card>
          )}

          {insights.length > 0 && (
            <div className="space-y-4 animate-fade-in-up animate-delay-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-purple" />
                <h3 className="text-sm font-semibold text-foreground">Data Summary</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                  {insights.length} findings
                </span>
              </div>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <Card key={insight.id} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5',
                          insight.trend === 'up'
                            ? 'bg-accent-purple-soft'
                            : insight.trend === 'down'
                              ? 'bg-accent-red-light'
                              : 'bg-muted'
                        )}
                      >
                        {insight.trend === 'up' && <TrendingUp className="h-4 w-4 text-accent-purple" />}
                        {insight.trend === 'down' && <TrendingDown className="h-4 w-4 text-accent-red" />}
                        {insight.trend === 'neutral' && <BarChart3 className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{insight.title}</p>
                          <span
                            className={cn(
                              'text-[11px] font-medium px-1.5 py-0.5 rounded-md shrink-0',
                              insight.trend === 'up'
                                ? 'text-accent-purple bg-accent-purple-soft'
                                : insight.trend === 'down'
                                  ? 'text-accent-red bg-accent-red-light'
                                  : 'text-muted-foreground bg-muted'
                            )}
                          >
                            {insight.metric}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-300">
            <Button
              className="flex-1 rounded-xl bg-accent-purple hover:bg-accent-purple-hover text-white justify-center text-sm"
              onClick={() => setActivePage('insights')}
            >
              Query your data
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl justify-center text-sm"
              onClick={() => setActivePage('visualizations')}
            >
              View all charts
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
