"use client";
import { useEffect, useRef, useState } from "react";

interface PredictionData {
  date: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
  trend: number;
}

export default function BoazTrendChart({
  labels,
  data,
  limit,
  title = "농도 추이",
  chartType = "line",
  showLimit30 = false,
  showPrediction = false,
  showAverage = false,
  xTimes,
  height,
  monthTicks,
  monthTickLabels,
  pointStacks,
  pointPayloads,
  exportRef,
  aiPredictions,
}: {
  labels: string[];
  data: number[];
  limit?: number;
  title?: string;
  chartType?: "line" | "bar" | "scatter";
  showLimit30?: boolean;
  showPrediction?: boolean;
  showAverage?: boolean;
  xTimes?: Array<string | number | Date>;
  height?: number; // px
  monthTicks?: number[];
  monthTickLabels?: string[];
  pointStacks?: string[];
  pointPayloads?: any[];
  exportRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  aiPredictions?: PredictionData[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // expose canvas to parent for export
  useEffect(() => {
    if (exportRef) exportRef.current = canvasRef.current;
  }, [exportRef, labels, data, chartType]);

  useEffect(() => {
    console.log("[BoazTrendChart] useEffect triggered", {
      hasLabels: !!labels,
      labelsLength: labels?.length,
      hasData: !!data,
      dataLength: data?.length,
      labelsType: typeof labels,
      dataType: typeof data,
      firstLabel: labels?.[0],
      firstData: data?.[0],
      chartType
    });

    let mounted = true;
    (async () => {
      try {
        const mod: any = await import("chart.js/auto");
        if (!mounted) return;
        setReady(true);
        
        if (!canvasRef.current) {
          console.log("[BoazTrendChart] ❌ No canvas ref!");
          return;
        }
        
        console.log("[BoazTrendChart] ✅ Canvas ref exists, proceeding...");
        
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) {
          console.log("[BoazTrendChart] ❌ No canvas context!");
          return;
        }
        // destroy previous
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        const ChartCtor = mod.default || mod.Chart; // default export in chart.js/auto

        // Build datasets
        const datasets: any[] = [];
        const allYValues: number[] = [];
        if (chartType === "scatter") {
          const toTs = (v: any, i: number) => {
            if (v instanceof Date) return v.getTime();
            if (typeof v === 'number') return v; // already numeric
            if (v) return new Date(v as any).getTime();
            // fallback to index as pseudo time
            return i + 1;
          };
          const rawPoints = data.map((y, i) => ({ x: toTs(xTimes && xTimes[i], i), y, stack: pointStacks?.[i], payload: pointPayloads?.[i] }));
          const seenXY = new Set<string>();
          const scatterPoints = rawPoints.filter((p) => {
            const t = typeof p.x === 'number' ? Math.floor(p.x / 60000) : Math.floor(new Date(p.x as any).getTime() / 60000);
            const yk = Number(p.y).toFixed(3);
            const key = `${t}|${yk}|${p.stack || ''}`;
            if (seenXY.has(key)) return false;
            seenXY.add(key);
            return true;
          });
          scatterPoints.forEach(p => { if (isFinite(p.y)) allYValues.push(p.y); });
          datasets.push({
            label: "실측값",
            data: scatterPoints,
            showLine: false,
            borderColor: "#3B82F6",
            backgroundColor: "#3B82F6",
            pointRadius: 4,
          });
        } else {
          data.forEach(v => { if (isFinite(v)) allYValues.push(v); });
          datasets.push({
            label: "실측값",
            data,
            borderColor: "#3B82F6",
            backgroundColor: chartType === "bar" ? "rgba(59,130,246,0.6)" : "rgba(59,130,246,0.2)",
            fill: chartType === "line",
            tension: chartType === "line" ? 0.25 : 0,
            pointRadius: chartType === "line" ? 3 : 0,
          });
        }

        // AI Prediction (AutoML Prophet)
        if (aiPredictions && aiPredictions.length > 0) {
          const aiDates = aiPredictions.map(p => p.date);
          const aiValues = aiPredictions.map(p => p.predicted_value);
          const aiLower = aiPredictions.map(p => p.lower_bound);
          const aiUpper = aiPredictions.map(p => p.upper_bound);
          
          if (chartType === "scatter") {
            // 예측값
            datasets.push({
              label: "AI 예측 (AutoML)",
              data: aiValues.map((y, i) => ({ x: new Date(aiDates[i]).getTime(), y })),
              showLine: true,
              borderColor: "#10B981",
              backgroundColor: "#10B981",
              pointRadius: 5,
              pointHoverRadius: 8,
              borderDash: [8, 4],
              borderWidth: 3,
            });
            // 신뢰구간 상한
            datasets.push({
              label: "예측 상한",
              data: aiUpper.map((y, i) => ({ x: new Date(aiDates[i]).getTime(), y })),
              showLine: true,
              borderColor: "rgba(16,185,129,0.3)",
              backgroundColor: "rgba(16,185,129,0.1)",
              pointRadius: 0,
              borderDash: [2, 2],
              fill: false,
            });
            // 신뢰구간 하한
            datasets.push({
              label: "예측 하한",
              data: aiLower.map((y, i) => ({ x: new Date(aiDates[i]).getTime(), y })),
              showLine: true,
              borderColor: "rgba(16,185,129,0.3)",
              backgroundColor: "rgba(16,185,129,0.1)",
              pointRadius: 0,
              borderDash: [2, 2],
              fill: '-1',
            });
          } else {
            // Line/Bar 차트
            datasets.push({
              label: "AI 예캁 (AutoML)",
              data: [...Array(data.length).fill(null), ...aiValues],
              borderColor: "#10B981",
              backgroundColor: "rgba(16,185,129,0.2)",
              fill: false,
              borderDash: [8, 4],
              borderWidth: 3,
              tension: 0.3,
              pointRadius: 3,
            });
          }
        }
        
        // Moving Average (7-day moving average for trend analysis)
        if (showPrediction) {
          const windowSize = Math.min(7, Math.max(3, Math.floor(data.length / 10))); // 적응형 윈도우 크기
          const movingAvg: number[] = [];
          for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const window = data.slice(start, i + 1);
            const avg = window.length ? window.reduce((a, b) => a + b, 0) / window.length : 0;
            movingAvg.push(Number(avg.toFixed(2)));
          }
          if (chartType === "scatter") {
            datasets.push({
              label: "이동평균선",
              data: movingAvg.map((y, i) => ({ x: (xTimes && xTimes[i] ? (xTimes[i] instanceof Date ? (xTimes[i] as Date).getTime() : (typeof xTimes[i] === 'number' ? (xTimes[i] as number) : new Date(xTimes[i] as any).getTime())) : i + 1), y })),
              showLine: true,
              borderColor: "#F59E0B",
              backgroundColor: "#F59E0B",
              pointRadius: 0,
              pointHitRadius: 0,
              hoverRadius: 0,
              borderDash: [5, 5],
              borderWidth: 2,
            });
          } else {
            datasets.push({
              label: "이동평균선",
              data: movingAvg,
              borderColor: "#F59E0B",
              backgroundColor: "rgba(245,158,11,0.2)",
              fill: false,
              borderDash: [5, 5],
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 2,
            });
          }
        }

        if (limit !== undefined) {
          if (chartType === "scatter") {
            datasets.push({
              label: "배출허용기준",
              data: [{ x: (xTimes && xTimes.length ? (xTimes[0] instanceof Date ? (xTimes[0] as Date).getTime() : (typeof xTimes[0] === 'number' ? (xTimes[0] as number) : new Date(xTimes[0] as any).getTime())) : 1), y: limit }, { x: (xTimes && xTimes.length ? (xTimes[xTimes.length - 1] instanceof Date ? (xTimes[xTimes.length - 1] as Date).getTime() : (typeof xTimes[xTimes.length - 1] === 'number' ? (xTimes[xTimes.length - 1] as number) : new Date(xTimes[xTimes.length - 1] as any).getTime())) : data.length), y: limit }],
              borderColor: "#EF4444",
              borderDash: [6, 6],
              pointRadius: 0,
              pointHitRadius: 0,
              hoverRadius: 0,
              fill: false,
              showLine: true,
            });
          } else {
            datasets.push({
              label: "배출허용기준",
              data: new Array(labels.length).fill(limit),
              borderColor: "#EF4444",
              borderDash: [6, 6],
              pointRadius: 0,
              fill: false,
            });
          }
          if (showLimit30) {
            const l30 = Number((limit * 0.3).toFixed(1));
            if (chartType === "scatter") {
              datasets.push({
                label: "30% 기준",
                data: [{ x: (xTimes && xTimes.length ? (xTimes[0] instanceof Date ? (xTimes[0] as Date).getTime() : (typeof xTimes[0] === 'number' ? (xTimes[0] as number) : new Date(xTimes[0] as any).getTime())) : 1), y: l30 }, { x: (xTimes && xTimes.length ? (xTimes[xTimes.length - 1] instanceof Date ? (xTimes[xTimes.length - 1] as Date).getTime() : (typeof xTimes[xTimes.length - 1] === 'number' ? (xTimes[xTimes.length - 1] as number) : new Date(xTimes[xTimes.length - 1] as any).getTime())) : data.length), y: l30 }],
                borderColor: "#60A5FA",
                pointRadius: 0,
                pointHitRadius: 0,
                hoverRadius: 0,
                fill: false,
                showLine: true,
              });
            } else {
              datasets.push({
                label: "30% 기준",
                data: new Array(labels.length).fill(l30),
                borderColor: "#60A5FA",
                pointRadius: 0,
                fill: false,
              });
            }
          }
        }

        if (chartType === "scatter" && showAverage && data.length) {
          const finite = data.filter((v) => Number.isFinite(v));
          const avg = finite.length ? finite.reduce((a, b) => a + b, 0) / finite.length : 0;
          datasets.push({
            label: "평균",
            data: [{ x: (xTimes && xTimes.length ? (xTimes[0] instanceof Date ? (xTimes[0] as Date).getTime() : (typeof xTimes[0] === 'number' ? (xTimes[0] as number) : new Date(xTimes[0] as any).getTime())) : 1), y: avg }, { x: (xTimes && xTimes.length ? (xTimes[xTimes.length - 1] instanceof Date ? (xTimes[xTimes.length - 1] as Date).getTime() : (typeof xTimes[xTimes.length - 1] === 'number' ? (xTimes[xTimes.length - 1] as number) : new Date(xTimes[xTimes.length - 1] as any).getTime())) : data.length), y: avg }],
            borderColor: "#10B981",
            pointRadius: 0,
            pointHitRadius: 0,
            hoverRadius: 0,
            fill: false,
            showLine: true,
            borderDash: [4, 4],
          });
        }

        // Dynamic Y scale to reveal small non-zero values
        const minY = allYValues.length ? Math.min(...allYValues) : 0;
        const maxY = allYValues.length ? Math.max(...allYValues) : 1;
        const same = isFinite(minY) && isFinite(maxY) && minY === maxY;
        const pad = same ? (maxY === 0 ? 1 : Math.abs(maxY) * 0.2) : Math.max(Math.abs(maxY - minY) * 0.1, 0.01);
        const suggestedMin = Math.max(0, minY - pad);
        const suggestedMax = maxY + pad;

        // Custom plugin to draw value labels on reference lines
        const lineValuePlugin = {
          id: 'lineValueLabels',
          afterDatasetsDraw: (chart: any) => {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            
            chart.data.datasets.forEach((dataset: any, i: number) => {
              const meta = chart.getDatasetMeta(i);
              if (!meta.visible) return;
              
              // Only draw labels for reference lines (배출허용기준, 30% 기준, 평균)
              const isReferenceLine = dataset.label === '배출허용기준' || 
                                     dataset.label === '30% 기준' || 
                                     dataset.label === '평균';
              
              if (isReferenceLine && dataset.data && dataset.data.length > 0) {
                const yValue = chartType === 'scatter' ? dataset.data[0].y : dataset.data[0];
                const yPixel = chart.scales.y.getPixelForValue(yValue);
                
                // Draw label on the left side of the chart
                ctx.save();
                ctx.fillStyle = dataset.borderColor || '#666';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                
                const labelText = `${yValue.toFixed(1)}`;
                const xPos = chartArea.left + 5;
                const yPos = yPixel - 3;
                
                // Draw background for better readability
                const textWidth = ctx.measureText(labelText).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(xPos - 2, yPos - 12, textWidth + 4, 14);
                
                // Draw text
                ctx.fillStyle = dataset.borderColor || '#666';
                ctx.fillText(labelText, xPos, yPos);
                ctx.restore();
              }
            });
          }
        };

        const chartConfig = {
          type: chartType === "scatter" ? "scatter" : chartType,
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 0,
                bottom: 10,
                left: 10,
                right: 10,
              }
            },
            plugins: {
              legend: { 
                display: true,
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                  boxWidth: 12,
                  boxHeight: 12,
                  padding: 8,
                  font: {
                    size: 11,
                  }
                }
              },
              title: { 
                display: true, 
                text: title,
                position: 'top' as const,
                align: 'start' as const,
                padding: {
                  top: 5,
                  bottom: 5,
                },
                font: {
                  size: 16,
                  weight: '600' as const,
                }
              },
              tooltip: {
                intersect: chartType === "scatter" ? true : false,
                mode: chartType === "scatter" ? "point" : ("index" as const),
                filter: chartType === "scatter" ? ((ctx: any) => {
                  // Show tooltip for real measurements and AI predictions only
                  const label = ctx?.dataset?.label;
                  return label === '실측값' || label === 'AI 예측 (AutoML)';
                }) : undefined,
                callbacks: chartType === "scatter" ? {
                  title: (items: any[]) => {
                    try {
                      const it = (items || []).find((x: any) => x && (x.raw?.payload || x.raw?.stack)) || items?.[0];
                      if (!it) return '';
                      const raw = it.raw || {};
                      const p = raw.payload || {};
                      const src = p.measuredAt ?? it.parsed?.x;
                      if (!src) return '';
                      const d = typeof src === 'number' ? new Date(src) : new Date(src);
                      if (isNaN(d.getTime())) return '';
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                    } catch { return ''; }
                  },
                  label: (ctx: any) => {
                    try {
                      const raw = ctx.raw || {};
                      const p = raw.payload || {};
                      const lines: string[] = [];
                      
                      // AI 예측인 경우
                      if (ctx.dataset?.label === 'AI 예측 (AutoML)') {
                        const val = typeof raw.y === 'number' ? raw.y : ctx.parsed?.y;
                        lines.push(`🤖 AI 예측값: ${val?.toFixed(2) || 'N/A'} mg/S㎥`);
                        lines.push('');
                        lines.push('📊 예측 정보:');
                        lines.push('• Prophet AutoML 모델 기반');
                        lines.push('• 고객사 전체 굴뚝 데이터 학습');
                        lines.push('• 과거 패턴 및 계절성 반영');
                        lines.push('• 30일 미래 예측');
                        return lines;
                      }
                      
                      // 실측값인 경우
                      const stackName = raw.stack || p.stack?.name || '';
                      if (stackName) lines.push(`굴뚝: ${stackName}`);
                      const val = typeof raw.y === 'number' ? raw.y : ctx.parsed?.y;
                      const unit = p.item?.unit || '';
                      if (val !== undefined && val !== null) lines.push(`농도: ${val}${unit ? ' ' + unit : ''}`);
                      if (p.item?.limit !== undefined && p.item?.limit !== null) lines.push(`허용기준: ${p.item.limit}`);
                      if (p.flowSm3Min !== undefined && p.flowSm3Min !== null) lines.push(`유량: ${p.flowSm3Min} Sm3/m`);
                      if (p.gasVelocityMs !== undefined && p.gasVelocityMs !== null) lines.push(`가스속도: ${p.gasVelocityMs} m/s`);
                      if (p.gasTempC !== undefined && p.gasTempC !== null) lines.push(`가스온도: ${p.gasTempC} ℃`);
                      if (p.moisturePct !== undefined && p.moisturePct !== null) lines.push(`수분함량: ${p.moisturePct}%`);
                      if (p.oxygenStdPct !== undefined && p.oxygenStdPct !== null) lines.push(`표준산소: ${p.oxygenStdPct}%`);
                      if (p.oxygenMeasuredPct !== undefined && p.oxygenMeasuredPct !== null) lines.push(`실측산소: ${p.oxygenMeasuredPct}%`);
                      if (p.windSpeedMs !== undefined && p.windSpeedMs !== null) lines.push(`풍속: ${p.windSpeedMs} m/s`);
                      if (p.weather) lines.push(`기상: ${p.weather}`);
                      if (p.measuringCompany) lines.push(`측정업체: ${p.measuringCompany}`);
                      return lines.length ? lines : '';
                    } catch { return ''; }
                  }
                } : undefined,
              },
            },
            interaction: chartType === "scatter" ? { mode: 'point' as const, intersect: true } : undefined,
            scales: {
              x: chartType === "scatter"
                ? ({ type: "linear" as const, beginAtZero: false,
                    min: (monthTicks && monthTicks.length ? monthTicks[0] : undefined),
                    max: (monthTicks && monthTicks.length ? monthTicks[monthTicks.length - 1] : undefined),
                    afterBuildTicks: (scale: any) => {
                      if (monthTicks && monthTicks.length) {
                        scale.ticks = monthTicks.map((v: number, i: number) => ({ value: v, label: monthTickLabels?.[i] ?? '' }));
                      }
                    },
                    ticks: {
                      autoSkip: false,
                      maxRotation: 0,
                      padding: 2,
                      callback: (_val: any, idx: number, ticks: any[]) => {
                        const t = ticks && ticks[idx];
                        if (t && typeof t.label === 'string') return t.label;
                        const v = Number(_val);
                        if (!isFinite(v)) return '';
                        const dt = new Date(v);
                        const m = (dt.getMonth() + 1).toString().padStart(2, '0');
                        return `${m}월`;
                      }
                    } })
                : { beginAtZero: true },
              y: { beginAtZero: false, suggestedMin, suggestedMax },
            },
          },
          plugins: [lineValuePlugin],
        };

        console.log("[BoazTrendChart] Creating chart with config:", {
          type: chartConfig.type,
          labelsLength: chartConfig.data.labels?.length,
          datasetsLength: chartConfig.data.datasets?.length,
          firstDatasetLength: chartConfig.data.datasets?.[0]?.data?.length,
          firstDatasetType: typeof chartConfig.data.datasets?.[0]?.data,
          firstDataPoint: chartConfig.data.datasets?.[0]?.data?.[0],
          xAxisType: chartConfig.options?.scales?.x?.type,
          xAxisMin: chartConfig.options?.scales?.x?.min,
          xAxisMax: chartConfig.options?.scales?.x?.max,
          monthTicksLength: monthTicks?.length,
          firstMonthTick: monthTicks?.[0],
          lastMonthTick: monthTicks?.[monthTicks?.length - 1]
        });

        chartRef.current = new ChartCtor(ctx, chartConfig);
        
        console.log("[BoazTrendChart] ✅ Chart created successfully!");
      } catch (e) {
        // Chart.js not installed yet; keep placeholder
        setReady(false);
      }
    })();
    return () => {
      mounted = false;
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, data, limit, title, chartType, showLimit30, showPrediction, showAverage]);

  return (
    <div className="w-full rounded-lg border bg-white/50 dark:bg-white/5 p-3" style={{ height: (height ?? 256) + "px" }}>
      <canvas ref={canvasRef} className="h-full w-full" />
      {!ready && (
        <div className="h-full w-full -mt-64 flex items-center justify-center text-xs text-gray-500">
          차트 라이브러리 미설치 상태입니다. chart.js 설치 후 자동 렌더링됩니다.
        </div>
      )}
    </div>
  );
}
