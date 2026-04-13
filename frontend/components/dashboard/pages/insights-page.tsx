'use client';

import React from 'react';
import {
  Loader2,
  MessageSquareText,
  SendHorizonal,
  Sparkles,
  Upload,
  UserRound,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { queryDataset } from '@/lib/api';
import { useAppStore, type ChatMessage } from '@/lib/app-store';
import { cn } from '@/lib/utils';

type ChartDatum = Record<string, string | number> & {
  label: string;
  value?: number;
  color?: string;
};

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

function formatTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageChart({ message }: { message: ChatMessage }) {
  const chartData = message.chartData as ChartDatum[] | undefined;

  if (!chartData || !message.chartType) {
    return null;
  }

  if (message.chartType === 'bar' && message.chartConfig) {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
        <ChartContainer config={message.chartConfig} className="h-[220px] w-full">
          <BarChart data={chartData} barGap={4} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#5F5F5F' }}
              dy={8}
              interval={0}
              angle={chartData.length > 6 ? -30 : 0}
              textAnchor={chartData.length > 6 ? 'end' : 'middle'}
              height={54}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#5F5F5F' }}
              dx={-4}
              width={55}
              tickFormatter={(value: number) => formatNumber(value)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {Object.entries(message.chartConfig).map(([key, config]) => (
              <Bar key={key} dataKey={key} fill={config.color} radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        </ChartContainer>
      </div>
    );
  }

  if (message.chartType === 'line' && message.chartConfig) {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
        <ChartContainer config={message.chartConfig} className="h-[220px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD9D3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#5F5F5F' }}
              dy={8}
              interval={0}
              angle={chartData.length > 8 ? -30 : 0}
              textAnchor={chartData.length > 8 ? 'end' : 'middle'}
              height={54}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#5F5F5F' }}
              dx={-4}
              width={55}
              tickFormatter={(value: number) => formatNumber(value)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {Object.entries(message.chartConfig).map(([key, config]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config.color}
                strokeWidth={2.5}
                dot={chartData.length < 15}
                activeDot={{ r: 4, fill: config.color }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
    );
  }

  if (message.chartType === 'pie') {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="h-[180px] w-[180px] shrink-0">
            <ChartContainer
              config={(message.chartConfig || {}) as ChartConfig}
              className="h-full w-full"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`pie-${entry.label}-${index}`}
                      fill={
                        entry.color ||
                        ['#505081', '#6B6BA8', '#8F8FC1', '#CFCFF0', '#3F3F66', '#7A7ACF'][
                          index % 6
                        ]
                      }
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>

          <div className="grid w-full grid-cols-2 gap-2">
            {chartData.slice(0, 6).map((datum) => (
              <div
                key={datum.label}
                className="rounded-xl border border-border/60 bg-card/70 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: datum.color || '#505081' }}
                  />
                  <p className="truncate text-[11px] text-muted-foreground">{datum.label}</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {(datum.value ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-purple-soft text-accent-purple">
          <MessageSquareText className="h-5 w-5" />
        </div>
      )}

      <div className={cn('max-w-[92%] space-y-3 sm:max-w-[82%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-3xl px-4 py-3 shadow-sm',
            isUser
              ? 'bg-accent-purple text-white'
              : 'border border-border/70 bg-card text-foreground'
          )}
        >
          <div className="flex items-center gap-2">
            <p className={cn('text-[11px] font-medium uppercase tracking-[0.14em]', isUser ? 'text-white/75' : 'text-muted-foreground')}>
              {isUser ? 'You' : 'AI Assistant'}
            </p>
          </div>

          <p className={cn('mt-2 text-sm leading-6', isUser ? 'text-white' : 'text-foreground')}>
            {message.content}
          </p>

          <div className={cn('mt-2 text-[11px]', isUser ? 'text-white/75' : 'text-muted-foreground')}>
            {message.timestamp}
          </div>
        </div>

        {!isUser && <MessageChart message={message} />}
      </div>

      {isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <UserRound className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

export function InsightsPage() {
  const [input, setInput] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const {
    datasetId,
    dataLoaded,
    uploadedFile,
    csvHeaders,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    addActivity,
    incrementQueries,
    setActivePage,
  } = useAppStore();

  const quickPrompts = React.useMemo(() => {
    const numericColumn = csvHeaders.find((header) => header.type === 'number')?.name || 'sales';
    const categoryColumn = csvHeaders.find((header) => header.type === 'string')?.name || 'category';

    return [
      `Top 5 ${categoryColumn.toLowerCase()} by ${numericColumn}`,
      `What is the ${numericColumn} distribution by ${categoryColumn.toLowerCase()}?`,
      `Summarize the most important insight from this dataset`,
      `Show the trend of ${numericColumn}`,
    ];
  }, [csvHeaders]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, isProcessing]);

  const sendQuestion = React.useCallback(
    async (presetQuestion?: string) => {
      const question = (presetQuestion ?? input).trim();

      if (!question || isProcessing) {
        return;
      }

      const userMessageId = `user-${Date.now()}`;
      addChatMessage({
        id: userMessageId,
        role: 'user',
        content: question,
        timestamp: formatTimestamp(),
      });

      setInput('');
      setErrorMessage('');
      setIsProcessing(true);

      try {
        const result = await queryDataset({
          datasetId: datasetId || undefined,
          question,
        });

        addChatMessage({
          id: result.id,
          role: 'ai',
          content: result.summary,
          chartType: result.chartType,
          chartData: result.chartData,
          chartConfig: result.chartConfig,
          metrics: result.metrics,
          provider: result.provider,
          usedAi: result.usedAi,
          aiStatus: result.aiStatus,
          keyPoints: result.keyPoints,
          followUps: result.followUps,
          timestamp: result.timestamp,
        });

        incrementQueries();
        addActivity({
          id: `query-${Date.now()}`,
          type: 'query',
          description: `"${question.slice(0, 52)}${question.length > 52 ? '...' : ''}"`,
          timestamp: 'Just now',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Query failed. Please try again.';
        setErrorMessage(message);
        addChatMessage({
          id: `ai-error-${Date.now()}`,
          role: 'ai',
          content: message,
          provider: 'system',
          usedAi: false,
          timestamp: formatTimestamp(),
          keyPoints: ['Check that the backend is running on port 5000.', 'Upload a dataset before asking for analysis.'],
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addActivity, addChatMessage, datasetId, incrementQueries, input, isProcessing]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void sendQuestion();
      }
    },
    [sendQuestion]
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-purple-soft text-accent-purple">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Results Chat</h2>
              <p className="text-sm text-muted-foreground">
                Ask in plain language and get chart-backed answers from your dashboard data.
              </p>
            </div>
          </div>
        </div>

        {!dataLoaded && (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No local dataset loaded yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV for the best experience, or ask a question and the backend will try the
                  latest stored dataset if one exists.
                </p>
                <button
                  type="button"
                  onClick={() => setActivePage('upload')}
                  className="text-sm font-medium text-accent-purple transition-colors hover:text-accent-purple-hover"
                >
                  Go to upload
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="space-y-0 p-0">
            <div className="border-b border-border/70 bg-card px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-accent-purple/30 bg-accent-purple-soft px-3 py-1 text-accent-purple"
                >
                  Chat ready
                </Badge>
                {uploadedFile && (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {uploadedFile.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="max-h-[68vh] min-h-[460px] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,248,238,0.65),rgba(255,255,255,0))] px-5 py-5">
              {chatMessages.length === 0 && !isProcessing && (
                <div className="rounded-[28px] border border-dashed border-border bg-background/80 p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-purple-soft text-accent-purple">
                    <MessageSquareText className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Start with a real question</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    Try asking for rankings, trends, breakdowns, or a plain-English summary. The
                    assistant will answer in chat and attach a chart when it helps.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendQuestion(prompt)}
                        className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-accent-purple/40 hover:bg-accent-purple-soft"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isProcessing && (
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-purple-soft text-accent-purple">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking through the dataset...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border/70 bg-card px-5 py-4">
              {errorMessage && (
                <p className="mb-3 text-sm text-accent-red">{errorMessage}</p>
              )}

              <div className="rounded-[28px] border border-border bg-background/90 p-3 shadow-sm">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask something like: Top 5 products by sales, show the sales trend, or summarize the biggest insight..."
                  className="min-h-[96px] resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                  disabled={isProcessing}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.slice(0, 2).map((prompt) => (
                      <button
                        key={`footer-${prompt}`}
                        type="button"
                        onClick={() => setInput(prompt)}
                        className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent-purple-soft hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <Button
                    className="rounded-full bg-accent-purple px-5 text-white hover:bg-accent-purple-hover"
                    onClick={() => void sendQuestion()}
                    disabled={!input.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Send
                        <SendHorizonal className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Dataset context
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                {uploadedFile ? uploadedFile.name : 'No active upload'}
              </h3>
            </div>

            {uploadedFile ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Rows</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {uploadedFile.rows.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Columns</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {uploadedFile.columns}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Upload a CSV to make the assistant much more precise and to store a dataset id in this session.
              </p>
            )}

            <Button
              variant="outline"
              className="w-full rounded-2xl"
              onClick={() => setActivePage('upload')}
            >
              Open upload page
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Conversation
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                  {chatMessages.length} message{chatMessages.length === 1 ? '' : 's'}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-3 text-xs"
                onClick={clearChatMessages}
                disabled={chatMessages.length === 0}
              >
                Clear chat
              </Button>
            </div>

            <div className="space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={`side-${prompt}`}
                  type="button"
                  onClick={() => void sendQuestion(prompt)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-accent-purple/40 hover:bg-accent-purple-soft"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
