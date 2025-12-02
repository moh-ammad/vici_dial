import React, { useEffect, useState } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import { getWithCache } from '../api';
import BackButton from './BackButton';

export default function AgentCampaignsPanel({ agentUser, agentName, onBack, onShowStats }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      setLoading(true);
      try{
        // call the proper campaigns endpoint that returns the snapshot data
        const r = await getWithCache(`/agents/campaigns?agent_user=${encodeURIComponent(agentUser)}`, { ttl: 30_000 });
        if (!mounted) return;
        setData(r?.data?.data || {});
      }catch(err){
        console.error(err);
      }finally{ if(mounted) setLoading(false); }
    }
    load();
    return ()=>{ mounted=false };
  },[agentUser]);

  if (loading) return <LoadingSkeleton rows={6} />;

  const campaigns = data?.campaigns || [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BackButton onClick={onBack} />
          <h1 className="text-3xl font-bold text-gray-900">Agent {agentUser} • {agentName || data?.agent_name || '—'}</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">View campaigns assigned to this agent</p>
          <button onClick={() => onShowStats && onShowStats()} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-sm">See stats</button>
        </div>
      </div>

      {campaigns.length ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-sm font-semibold text-gray-700">
                <th className="py-4 px-6 text-left">S.No</th>
                <th className="py-4 px-6 text-left">Campaign ID</th>
                <th className="py-4 px-6 text-left">Campaign Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((c, idx) => (
                <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 text-gray-500">{idx+1}</td>
                  <td className="py-4 px-6 font-mono text-sm text-blue-600 font-medium">{c.id}</td>
                  <td className="py-4 px-6 text-gray-900">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">No campaigns</div>
      )}
    </div>
  )
}
