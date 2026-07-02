"use client";

import React, { useState, useMemo } from "react";
import { BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type BidDataPoint = {
  window: string;
  befVac: number;
  aftVac: number;
  minBid: number;
  medBid: number;
};

type BidAnalyticsProps = {
  data: {
    [instructor: string]: {
      [term: string]: {
        [section: string]: BidDataPoint[];
      };
    };
  } | null;
  schedules?: any[];
};

function toTitleCase(str: string) {
  if (!str) return str;
  // Handle special cases or just basic title casing
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

export default function BidAnalytics({ data, schedules }: BidAnalyticsProps) {
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedWindow, setSelectedWindow] = useState<string>("");

  // Extract all available terms across all instructors
  const terms = useMemo(() => {
    if (!data) return [];
    const termSet = new Set<string>();
    Object.values(data).forEach(termMap => {
      Object.keys(termMap).forEach(term => termSet.add(term));
    });
    // Sort descending to show newest first
    return Array.from(termSet).sort().reverse();
  }, [data]);

  // Set default term
  useMemo(() => {
    if (terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0]);
    }
  }, [terms, selectedTerm]);

  // Extract all windows for the selected term
  const windows = useMemo(() => {
    if (!data || !selectedTerm) return [];
    const winSet = new Set<string>();
    Object.values(data).forEach(termMap => {
      if (termMap[selectedTerm]) {
        Object.values(termMap[selectedTerm]).forEach(secArray => {
          secArray.forEach(dp => winSet.add(dp.window));
        });
      }
    });
    return Array.from(winSet).sort();
  }, [data, selectedTerm]);

  // Set default window
  useMemo(() => {
    if (windows.length > 0 && (!selectedWindow || !windows.includes(selectedWindow))) {
      setSelectedWindow(windows[0]);
    }
  }, [windows, selectedWindow]);

  // Build the chart data combining all instructors for the selected term and window
  const chartData = useMemo(() => {
    if (!data || !selectedTerm || !selectedWindow) return [];
    
    const results: any[] = [];
    Object.entries(data).forEach(([instructor, termMap]) => {
      if (termMap[selectedTerm]) {
        Object.entries(termMap[selectedTerm]).forEach(([section, secArray]) => {
          const dp = secArray.find(d => d.window === selectedWindow);
          if (dp) {
            results.push({
              name: `${toTitleCase(instructor)} (${section})`,
              minBid: dp.minBid,
              medBid: dp.medBid,
              befVac: dp.befVac
            });
          }
        });
      }
    });

    // Sort by median bid (most expensive to least expensive)
    return results.sort((a, b) => b.medBid - a.medBid);
  }, [data, selectedTerm, selectedWindow, schedules]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 p-3 rounded-lg shadow-xl text-sm md:text-base">
          <p className="font-semibold text-neutral-900 dark:text-[#e5e5e5] mb-2">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }} className="text-xs md:text-sm font-medium">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || terms.length === 0) {
    return (
      <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
            Bid Analytics
          </h3>
        </div>
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-8 text-center">
          <BarChart2 className="mx-auto h-8 w-8 text-neutral-400 mb-3 opacity-50" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">
            No historical bidding analytics available for this course yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
          Bid Analytics
        </h3>
      </div>

      <div className="p-4 md:p-6 bg-white/80 dark:bg-[#0a0a0a]/80 border border-black/10 dark:border-white/10 rounded-xl backdrop-blur-xl shadow-md dark:shadow-none">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 md:mb-8">
          <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px]">
            <label className="text-xs text-neutral-600 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none shadow-sm dark:shadow-none"
            >
              {terms.map((term) => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-full md:w-auto min-w-[200px]">
            <label className="text-xs text-neutral-600 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">Bidding Window</label>
            <select
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(e.target.value)}
              className="bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none shadow-sm dark:shadow-none"
            >
              {windows.map((win) => (
                <option key={win} value={win}>{win}</option>
              ))}
            </select>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-[350px] md:h-[450px] w-full -ml-4 md:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#737373" 
                  tick={{ fill: '#a3a3a3', fontSize: 11 }} 
                  tickMargin={30}
                  axisLine={{ stroke: '#404040' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  stroke="#737373" 
                  tick={{ fill: '#a3a3a3', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Bid Amount', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 11, offset: 15 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Legend 
                  verticalAlign="top"
                  wrapperStyle={{ paddingBottom: '20px' }}
                  iconType="circle"
                />
                <Bar dataKey="medBid" name="Median Bid" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="minBid" name="Minimum Bid" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No bidding data available for this term and window.
          </div>
        )}
      </div>
    </div>
  );
}
