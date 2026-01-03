import React, { useMemo } from 'react';
import { Asset, TagSource } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';

interface InsightsViewProps {
  assets: Asset[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ assets }) => {
  
  const stats = useMemo(() => {
    const totalAssets = assets.length;
    const processed = assets.filter(a => a.processed).length;
    const flagged = assets.filter(a => a.flagged).length;
    const audioCount = assets.filter(a => a.type === 'audio').length;
    const imageCount = assets.filter(a => a.type === 'image').length;
    const videoCount = assets.filter(a => a.type === 'video').length;
    
    // Tag Frequency
    const tagCounts: Record<string, number> = {};
    assets.forEach(a => {
        a.tags.forEach(t => {
            tagCounts[t.name] = (tagCounts[t.name] || 0) + 1;
        });
    });

    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    // Source Distribution
    const sources = {
        [TagSource.MANUAL]: 0,
        [TagSource.AI_COMFY]: 0,
        [TagSource.AI_GEMINI]: 0,
    };
    assets.forEach(a => {
        a.tags.forEach(t => {
            if (sources[t.source] !== undefined) sources[t.source]++;
        });
    });
    
    const sourceData = [
        { name: 'Manual', value: sources[TagSource.MANUAL], color: '#71717a' }, // zinc-500
        { name: 'LocalCura', value: sources[TagSource.AI_COMFY], color: '#10b981' }, // emerald-500
        { name: 'Gemini', value: sources[TagSource.AI_GEMINI], color: '#3b82f6' }, // blue-500
    ];

    return { totalAssets, processed, flagged, audioCount, imageCount, videoCount, topTags, sourceData };
  }, [assets]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">Dataset Insights</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
           <p className="text-zinc-500 text-sm font-medium">Total Assets</p>
           <p className="text-3xl font-bold text-white mt-1">{stats.totalAssets}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
           <p className="text-zinc-500 text-sm font-medium">Images</p>
           <p className="text-3xl font-bold text-purple-400 mt-1">{stats.imageCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
           <p className="text-zinc-500 text-sm font-medium">Audio Files</p>
           <p className="text-3xl font-bold text-pink-400 mt-1">{stats.audioCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
           <p className="text-zinc-500 text-sm font-medium">Videos</p>
           <p className="text-3xl font-bold text-cyan-400 mt-1">{stats.videoCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
           <p className="text-zinc-500 text-sm font-medium">AI Processed</p>
           <p className="text-3xl font-bold text-blue-500 mt-1">{stats.processed}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
           <p className="text-zinc-500 text-sm font-medium">Completion</p>
           <p className="text-3xl font-bold text-emerald-500 mt-1">
             {stats.totalAssets ? Math.round((stats.processed / stats.totalAssets) * 100) : 0}%
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Tags Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg h-96">
            <h3 className="text-lg font-semibold text-zinc-200 mb-6">Top Tags Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topTags} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" stroke="#52525b" />
                    <YAxis dataKey="name" type="category" stroke="#a1a1aa" width={100} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                        cursor={{fill: '#27272a'}}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tag Source Pie */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg h-96">
             <h3 className="text-lg font-semibold text-zinc-200 mb-6">Tag Source Composition</h3>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={stats.sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {stats.sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex justify-center gap-6 mt-4">
                 {stats.sourceData.map(d => (
                     <div key={d.name} className="flex items-center text-sm text-zinc-400">
                         <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.color }}></div>
                         {d.name}
                     </div>
                 ))}
             </div>
          </div>
      </div>
    </div>
  );
};
