import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getWithCache } from '../api';
import MetricCard from '../components/MetricCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSkeleton from '../components/LoadingSkeleton';
import BackButton from '../components/BackButton';

export default function AgentStats(){
  const { agent_user } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true);
      try{
        const qs = new URLSearchParams(location.search);
        const startParam = qs.get('start');
        const endParam = qs.get('end');

        const fmt = d => {
          const YYYY = d.getFullYear();
          const MM = String(d.getMonth() + 1).padStart(2, '0');
          const DD = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          const ss = String(d.getSeconds()).padStart(2, '0');
          return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
        };

        let start, end;
        if (startParam && endParam) {
          start = new Date(startParam);
          end = new Date(endParam);
        } else {
          end = new Date();
          start = new Date(end.getTime() - (90*24*60*60*1000));
        }

        const r = await getWithCache(`/agents/stats/single?agent_user=${encodeURIComponent(agent_user)}&start=${encodeURIComponent(fmt(start))}&end=${encodeURIComponent(fmt(end))}`, { ttl: 20_000 });
        setData(r.data.data);
      }catch(e){ console.error(e); }
      finally{ setLoading(false); }
    }
    load();
  },[agent_user]);

  if(loading) return <LoadingSkeleton rows={6} />
  if(!data) return <div className="py-6 text-slate-400">No stats found</div>

  const parseTimeToSeconds = (t) => {
    if (!t) return 0;
    if (typeof t === 'number') return t;
    // expected formats: H:MM:SS or M:SS or 0:18 or '18' etc
    const parts = String(t).split(':').map(p => Number(p));
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if (parts.length === 2) return parts[0]*60 + parts[1];
    return Number(parts[0]) || 0;
  }

  const chartData = [
    { name: 'Calls', value: Number(data.calls || 0) },
    { name: 'Login (s)', value: parseTimeToSeconds(data.login_time) },
    { name: 'Talk (s)', value: parseTimeToSeconds(data.total_talk_time || data.talk_time) },
    { name: 'Avg Wait (s)', value: parseTimeToSeconds(data.avg_wait_time) },
    { name: 'Pause (s)', value: parseTimeToSeconds(data.pause_time) },
    { name: 'Dispo (s)', value: parseTimeToSeconds(data.dispo_time) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <h2 className="text-xl font-semibold">Stats for {agent_user} • {data.full_name || data.user}</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Calls" value={data.calls || '0'} />
        <MetricCard title="Login Time" value={data.login_time || '0'} />
        <MetricCard title="Talk Time" value={data.total_talk_time || data.talk_time || '0'} />
        <MetricCard title="Avg Wait" value={data.avg_wait_time || '0'} />
        <MetricCard title="Pause Time" value={data.pause_time || '0'} />
        <MetricCard title="Dispo Time" value={data.dispo_time || '0'} />
      </div>

      <div style={{height:260}} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 6 }}>
            <XAxis dataKey="name" tick={{fontSize:12}} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-900/40 rounded p-3 mt-3 text-sm text-slate-200">
        <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )
}
