'use client';

import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChevronDownIcon } from '@/components/icons';
import type { ProjectsHealth } from '../dashboard.types';

interface OverallProgressProps {
  totalProjects: number;
  completedPercent: number;
  health: ProjectsHealth;
}

const SEGMENT_ORDER = [
  { key: 'completed', color: '#22c55e' },
  { key: 'delayed', color: '#b59a1a' },
  { key: 'on_track', color: '#c4652a' },
  { key: 'at_risk', color: '#d1d5db' },
] as const;

const STAT_ITEMS = [
  { key: 'total', color: 'text-text-primary', label: 'Total projects' },
  { key: 'completed', color: 'text-status-completed', label: 'Completed' },
  { key: 'delayed', color: 'text-status-delayed', label: 'Delayed' },
  { key: 'on_track', color: 'text-status-ongoing', label: 'On going' },
] as const;

function buildGaugeOption(percent: number, health: ProjectsHealth, total: number) {
  // Build color stops proportional to health data
  const colorStops: [number, string][] = [];
  let accumulated = 0;

  if (total > 0) {
    for (const seg of SEGMENT_ORDER) {
      const count = health[seg.key as keyof ProjectsHealth] || 0;
      const ratio = count / total;
      if (ratio > 0) {
        accumulated += ratio;
        colorStops.push([accumulated, seg.color]);
      }
    }
  }

  // Fill remaining with gray if segments don't cover 100%
  if (accumulated < 1) {
    colorStops.push([1, '#e5e0da']);
  }

  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '110%',
        min: 0,
        max: 100,
        splitNumber: 4,
        axisLine: {
          lineStyle: {
            width: 20,
            color: colorStops,
          },
          roundCap: true,
        },
        pointer: {
          show: false,
        },
        axisTick: {
          distance: 2,
          length: 6,
          lineStyle: {
            color: '#c5bfb8',
            width: 1,
          },
          splitNumber: 10,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          color: '#9ca3af',
          distance: 14,
          fontSize: 11,
          formatter: (value: number) => {
            if (value === 0 || value === 25 || value === 50 || value === 75 || value === 100) {
              return `${value}`;
            }
            return '';
          },
        },
        title: {
          offsetCenter: [0, '10%'],
          fontSize: 13,
          color: '#9ca3af',
        },
        detail: {
          offsetCenter: [0, '-15%'],
          fontSize: 36,
          fontWeight: 'bold',
          formatter: `${percent}%`,
          color: '#1f2937',
        },
        data: [
          {
            value: percent,
            name: 'Completed',
          },
        ],
      },
    ],
  };
}

export default memo(function OverallProgress({ totalProjects, completedPercent, health }: OverallProgressProps) {

  const option = useMemo(
    () => buildGaugeOption(completedPercent, health, totalProjects),
    [completedPercent, health, totalProjects],
  );

  const statValues: Record<string, number> = {
    total: totalProjects,
    completed: health.completed,
    delayed: health.delayed,
    on_track: health.on_track,
  };

  return (
    <div className="rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Overall Progress</h3>
        <div className="relative">
          <select className="appearance-none rounded-full bg-white pl-4 pr-8 py-1.5 text-sm font-medium text-text-primary shadow-sm outline-none cursor-pointer">
            <option>All</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDownIcon className="h-4 w-4 text-text-secondary pointer-events-none" /></span>
        </div>
      </div>

      <div className="-mb-8">
        <ReactECharts
          option={option}
          style={{ height: 250, width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {STAT_ITEMS.map((item) => (
          <div key={item.key}>
            <p className={`text-2xl font-bold ${item.color}`}>{statValues[item.key]}</p>
            <p className="text-[11px] text-text-secondary">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
});
