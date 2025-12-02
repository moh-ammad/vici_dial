import React, { useEffect, useState } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import { getWithCache } from '../api';
import MetricCard from './MetricCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import BackButton from './BackButton';

export default function AgentStatsPanel({ agentUser, agentName, onBack }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      setLoading(true);
      try{
        const end = new Date();
        const start = new Date(end.getTime() - (90*24*60*60*1000));
        const fmt = d => {
          const YYYY = d.getFullYear();
          const MM = String(d.getMonth() + 1).padStart(2, '0');
          const DD = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          const ss = String(d.getSeconds()).padStart(2, '0');
          return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
        };

        const r = await getWithCache(`/agents/stats/single?agent_user=${encodeURIComponent(agentUser)}&start=${encodeURIComponent(fmt(start))}&end=${encodeURIComponent(fmt(end))}`, { ttl: 20_000 });
        if (!mounted) return;
        const payload = r?.data?.data;
        if (Array.isArray(payload)) {
          setData(payload[0] || null);
        } else {
          setData(payload || null);
        }
      }catch(err){ console.error(err); }
      finally{ if(mounted) setLoading(false); }
    }
    load();
    return ()=>{ mounted = false };
  },[agentUser]);

  const parse = t => {
    if(!t) return 0;
    const parts = String(t).split(':').map(n=>Number(n));
    if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if(parts.length === 2) return parts[0]*60 + parts[1];
    return Number(parts[0]) || 0;
  }

  const chartData = data ? [
    { name: 'Calls', value: Number(data.calls || 0), fill: '#3b82f6' },
    { name: 'Login (s)', value: parse(data.login_time), fill: '#10b981' },
    { name: 'Talk (s)', value: parse(data.total_talk_time || data.talk_time), fill: '#ec4899' },
    { name: 'Pause (s)', value: parse(data.pause_time), fill: '#8b5cf6' },
    { name: 'Dispo (s)', value: parse(data.dispo_time), fill: '#f59e0b' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BackButton onClick={onBack} />
          <h1 className="text-3xl font-bold text-gray-900">Stats for {agentUser} • {agentName || (data && data.full_name) || '—'}</h1>
        </div>
        <p className="text-gray-600">Performance metrics and analytics</p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (!data ? (
        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">No stats found</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard title="Calls" value={data.calls || '0'} color="blue" />
            <MetricCard title="Login Time" value={data.login_time || '0:00'} color="green" />
            <MetricCard title="Talk Time" value={data.total_talk_time || data.talk_time || '0:00'} color="pink" />
            <MetricCard title="Pause Time" value={data.pause_time || '0:00'} color="purple" />
            <MetricCard title="Dispo Time" value={data.dispo_time || '0:00'} color="orange" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard title="Wait Time" value={data.wait_time || '0:00'} color="gray" />
            <MetricCard title="Avg Session" value={data.avg_session || '0:00'} color="indigo" />
            <MetricCard title="Pauses" value={data.pauses || '0'} color="cyan" />
            <MetricCard title="Sessions" value={data.sessions || '0'} color="teal" />
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div style={{height:320}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{top:10,right:20,left:10,bottom:20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{fontSize:12, fill: '#6b7280'}} />
                  <YAxis tick={{fontSize:12, fill: '#6b7280'}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{color: '#111827', fontWeight: 600}}
                    itemStyle={{color: '#6b7280'}}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ))}
    </div>
  )
}
