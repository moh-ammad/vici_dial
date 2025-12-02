import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { getWithCache } from '../api';
import BackButton from '../components/BackButton';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function AgentCampaigns(){
  const { agent_user } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true);
      try{
        const r = await getWithCache(`/agents/campaigns?agent_user=${encodeURIComponent(agent_user)}`, { ttl: 30_000 });
        setData(r.data.data);
      }catch(e){
        console.error(e);
      }finally{ setLoading(false); }
    }
    load();
  },[agent_user]);
  if(loading) return <LoadingSkeleton rows={6} />
  if(!data) return <div className="py-6 text-slate-400">No data</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h2 className="text-xl font-semibold">Agent {data.agent_user} • {data.agent_name || '—'}</h2>
          <p className="text-sm text-slate-400 mt-1">View campaigns assigned to this agent</p>
        </div>

        <div>
          <Link to={`/agents/${encodeURIComponent(agent_user)}/stats`} className="px-3 py-2 bg-slate-700 rounded-md text-white">See stats</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-sm font-medium opacity-90">Total Campaigns</div>
          <div className="text-4xl font-bold mt-2">{data.count_campaigns || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-sm font-medium opacity-90">Agent ID</div>
          <div className="text-3xl font-bold mt-2">{data.agent_user}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-sm font-medium opacity-90">Ingroups</div>
          <div className="text-3xl font-bold mt-2">{data.count_ingroups || 0}</div>
        </div>
      </div>

      <div>
        {data.campaigns && data.campaigns.length ? (
          <table className="min-w-full">
            <thead>
              <tr className="text-sm text-slate-300 border-b border-slate-700"><th className="py-3">S.No</th><th className="py-3">Campaign ID</th><th className="py-3">Campaign Name</th></tr>
            </thead>
            <tbody>
              {data.campaigns.map((c, idx) => (
                <tr key={c.id} className={idx%2? 'bg-slate-900/40':''}>
                  <td className="py-3 px-4">{idx+1}</td>
                  <td className="py-3 px-4 font-mono">{c.id}</td>
                  <td className="py-3">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No campaigns</div>
        )}
      </div>
    </div>
  );
}
