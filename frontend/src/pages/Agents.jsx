import React, { useEffect, useState } from 'react';
import api, { getWithCache } from '../api';
import MetricCard from '../components/MetricCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AgentCampaignsPanel from '../components/AgentCampaignsPanel';
import AgentStatsPanel from '../components/AgentStatsPanel';

export default function Agents(){
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [totals, setTotals] = useState({agents:0, campaigns:0});
  const [view, setView] = useState('list'); // 'list' | 'campaigns' | 'stats'
  const [selectedAgent, setSelectedAgent] = useState(null);

  const loadAgentsData = async () => {
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

      // Use cached GET to avoid repeated network fetches
      const statsRes = await getWithCache(`/agents/stats?start=${encodeURIComponent(fmt(start))}&end=${encodeURIComponent(fmt(end))}`, { ttl: 30_000 });
      const list = Array.isArray(statsRes.data.data) ? statsRes.data.data : (statsRes.data.data? [statsRes.data.data]: []);

      // Build agent list without doing per-agent extra requests (avoids N+1 problem)
      const withStats = list.map(a => {
        const user = a.user || a.agent_user || a.user_id || a.user;
        return { user, name: a.full_name || a.fullname || a.name || a.user || a.agent_name || '', stats: a };
      });

      // set basic list and mark campaigns unknown until counts load
      setTotals({ agents: withStats.length, campaigns: null });
      // store agents without campaign counts yet
      setAgents(withStats.map(s => ({ ...s, campaigns: undefined })));

      // fetch campaign counts in a single call to avoid N+1 remote requests
      try {
        const countsRes = await getWithCache(`/agents/campaigns/counts`, { ttl: 30_000 });
        const countsMap = countsRes?.data?.data || {};
        const withCounts = withStats.map(s => ({ ...s, campaigns: Number(countsMap[String(s.user)] || 0) }));
        const totalCampaigns = Object.values(countsMap).reduce((sum, v) => sum + Number(v || 0), 0);
        setAgents(withCounts);
        setTotals(t => ({ ...t, campaigns: totalCampaigns }));
      } catch (err) {
        console.warn('counts fetch failed', err);
        // fallback to zero if counts endpoint unavailable
        const withCounts = withStats.map(s => ({ ...s, campaigns: 0 }));
        setAgents(withCounts);
        setTotals(t => ({ ...t, campaigns: 0 }));
      }
    }catch(err){
      console.error(err);
    }finally{ setLoading(false); }
  };

  const handleSyncCampaigns = async () => {
    setSyncing(true);
    try {
      const res = await api.get('/agents/campaigns/sync-all');
      console.log('Sync result:', res.data);
      // Reload data after sync
      await loadAgentsData();
      alert(`✅ Synced campaigns for ${res.data.data.agents_processed} agents! Total: ${res.data.data.total_campaigns} campaigns`);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('❌ Failed to sync campaigns: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(()=>{
    loadAgentsData();
  },[]);
  

  const handleRowClick = (agent) => {
    setSelectedAgent(agent);
    setView('campaigns');
  };

  const handleShowStats = () => setView('stats');
  const handleBackToList = () => { setView('list'); setSelectedAgent(null); };

  return (
    <div className="space-y-8">
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agents</h1>
              <p className="text-gray-600">View and manage agent assignments</p>
            </div>
            <button 
              onClick={handleSyncCampaigns} 
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {syncing ? '🔄 Syncing...' : '🔄 Sync All Campaigns'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Agents" value={totals.agents} color="blue" />
            <MetricCard title="Total Campaigns (sum)" value={totals.campaigns} color="green" />
            <MetricCard title="Live Agents" value={'—'} color="pink" />
            <MetricCard title="Inactive" value={'—'} color="gray" />
          </div>
        </>
      )}

      {view === 'list' && (
        <div>
          {loading ? (
            <LoadingSkeleton rows={8} columns={4} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-sm font-semibold text-gray-700">
                    <th className="py-4 px-6 text-left">S.No</th>
                    <th className="py-4 px-6 text-left">Agent ID</th>
                    <th className="py-4 px-6 text-left">Agent Name</th>
                    <th className="py-4 px-6 text-left">Campaigns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {agents.map((a, idx) => (
                    <tr key={a.user || idx} className="cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleRowClick(a)}>
                      <td className="py-4 px-6 text-gray-500">{idx+1}</td>
                      <td className="py-4 px-6 font-mono text-sm text-blue-600 font-medium">{a.user}</td>
                      <td className="py-4 px-6 text-gray-900 font-medium">{a.name || (a.stats && a.stats.full_name) || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                          {typeof a.campaigns === 'number' ? a.campaigns : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'campaigns' && selectedAgent && (
        <AgentCampaignsPanel agentUser={selectedAgent.user} agentName={selectedAgent.name} onBack={handleBackToList} onShowStats={handleShowStats} />
      )}

      {view === 'stats' && selectedAgent && (
        <AgentStatsPanel agentUser={selectedAgent.user} agentName={selectedAgent.name} onBack={() => setView('campaigns')} />
      )}
    </div>
  )
}
