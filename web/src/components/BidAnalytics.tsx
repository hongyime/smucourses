"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { ChevronDown, BarChart2 } from "lucide-react";

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
};

export default function BidAnalytics({ data }: BidAnalyticsProps) {
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  // Derive available options
  const instructors = useMemo(() => (data ? Object.keys(data).filter(i => i) : []), [data]);
  
  // Set defaults when data loads
  useMemo(() => {
    if (instructors.length > 0 && !selectedInstructor) {
      setSelectedInstructor(instructors[0]);
    }
  }, [instructors, selectedInstructor]);

  const terms = useMemo(() => {
    if (!data || !selectedInstructor || !data[selectedInstructor]) return [];
    return Object.keys(data[selectedInstructor]);
  }, [data, selectedInstructor]);

  useMemo(() => {
    if (terms.length > 0 && !terms.includes(selectedTerm)) {
      setSelectedTerm(terms[terms.length - 1]); // typically latest term is at the end or we can just pick [0]
    }
  }, [terms, selectedTerm]);

  const sections = useMemo(() => {
    if (!data || !selectedInstructor || !selectedTerm || !data[selectedInstructor][selectedTerm]) return [];
    return Object.keys(data[selectedInstructor][selectedTerm]);
  }, [data, selectedInstructor, selectedTerm]);

  useMemo(() => {
    if (sections.length > 0 && !sections.includes(selectedSection)) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

  const chartData = useMemo(() => {
    if (!data || !selectedInstructor || !selectedTerm || !selectedSection) return [];
    return data[selectedInstructor]?.[selectedTerm]?.[selectedSection] || [];
  }, [data, selectedInstructor, selectedTerm, selectedSection]);

  if (!data || instructors.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors backdrop-blur-md"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#2563eb]/20 text-[#3b82f6] rounded-lg">
            <BarChart2 size={20} />
          </div>
          <h2 className="text-xl font-semibold text-[#e5e5e5]">Bid Analytics</h2>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 mt-4 bg-[#0a0a0a]/80 border border-white/10 rounded-xl backdrop-blur-xl">
              
              {/* Selectors */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1 ml-1 uppercase tracking-wider">Instructor</label>
                  <select
                    value={selectedInstructor}
                    onChange={(e) => setSelectedInstructor(e.target.value)}
                    className="bg-[#171717] border border-white/10 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                  >
                    {instructors.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1 ml-1 uppercase tracking-wider">Term</label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="bg-[#171717] border border-white/10 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                  >
                    {terms.map((term) => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1 ml-1 uppercase tracking-wider">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="bg-[#171717] border border-white/10 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                  >
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chart */}
              {chartData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                      <XAxis 
                        dataKey="window" 
                        stroke="#737373" 
                        tick={{ fill: '#a3a3a3', fontSize: 12 }} 
                        tickMargin={15}
                        axisLine={{ stroke: '#404040' }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        stroke="#737373" 
                        tick={{ fill: '#a3a3a3', fontSize: 12 }} 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Vacancy', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#737373" 
                        tick={{ fill: '#a3a3a3', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Bid Amount (e$)', angle: 90, position: 'insideRight', fill: '#737373', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#171717', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#e5e5e5',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#e5e5e5' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Bar yAxisId="left" dataKey="befVac" name="Before Process Vacancy" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      <Bar yAxisId="left" dataKey="aftVac" name="After Process Vacancy" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      <Line yAxisId="right" type="monotone" dataKey="minBid" name="Minimum Bid" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                      <Line yAxisId="right" type="monotone" dataKey="medBid" name="Median Bid" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No data available for this selection.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
