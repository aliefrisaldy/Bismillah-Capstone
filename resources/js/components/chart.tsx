import { useMemo } from 'react';

interface LineChartProps {
    data: number[];
    labels: string[];
    className?: string;
    color?: string;
    height?: number;
}

export function LineChart({
    data,
    labels,
    className = '',
    color = '#10b981',
    height = 220,
}: LineChartProps) {
    const maxVal = useMemo(() => Math.max(...data, 1), [data]);

    const padding = { top: 20, right: 12, bottom: 28, left: 32 };
    const chartW = 100;
    const chartH = 100;

    const xScale = (i: number) =>
        padding.left + (i / Math.max(data.length - 1, 1)) * (chartW - padding.left - padding.right);
    const yScale = (v: number) =>
        chartH - padding.bottom - ((v / maxVal) * (chartH - padding.top - padding.bottom));

    const lineD = data
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(v)}`)
        .join(' ');

    const areaD = `${lineD}L${xScale(data.length - 1)},${chartH - padding.bottom}L${xScale(0)},${chartH - padding.bottom}Z`;

    const yTicks = useMemo(() => {
        const ticks: number[] = [];
        const step = Math.max(1, Math.ceil(maxVal / 4));

        for (let v = 0; v <= maxVal; v += step) {
            ticks.push(v);
        }

        if (ticks[ticks.length - 1] !== maxVal) {
            ticks.push(maxVal);
        }

        return ticks;
    }, [maxVal]);

    return (
        <div className={`w-full ${className}`}>
            <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full"
                style={{ height }}
            >
                {/* Y-axis labels */}
                {yTicks.map((v) => (
                    <text
                        key={v}
                        x={padding.left - 6}
                        y={yScale(v) + 3}
                        textAnchor="end"
                        className="fill-muted-foreground/60 text-[6px]"
                    >
                        {v}
                    </text>
                ))}

                {/* Horizontal grid lines */}
                {yTicks.map((v) => (
                    <line
                        key={`g-${v}`}
                        x1={padding.left}
                        y1={yScale(v)}
                        x2={chartW - padding.right}
                        y2={yScale(v)}
                        className="stroke-border/50"
                        strokeWidth={0.3}
                    />
                ))}

                {/* Area fill */}
                <path d={areaD} fill={color} fillOpacity={0.1} />

                {/* Line */}
                <path
                    d={lineD}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Dots */}
                {data.map((v, i) => (
                    <circle
                        key={i}
                        cx={xScale(i)}
                        cy={yScale(v)}
                        r={2}
                        fill={color}
                        className="drop-shadow-sm"
                    />
                ))}

                {/* X-axis labels */}
                {labels.map((label, i) => (
                    <text
                        key={i}
                        x={xScale(i)}
                        y={chartH - 6}
                        textAnchor="middle"
                        className="fill-muted-foreground/60 text-[5.5px]"
                    >
                        {label}
                    </text>
                ))}
            </svg>
        </div>
    );
}
