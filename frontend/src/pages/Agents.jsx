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
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const perPage = 8;

  const loadAgentsData = async (pageNum = 1) => {
    setLoading(true);
    try{
      // fetch paginated agents from backend (db)
      const r = await api.get(`/agents/stats/paginated?page=${pageNum}&perPage=${perPage}`);
      const payload = r?.data?.data || {};
      const list = Array.isArray(payload.data) ? payload.data : [];

      // map agents for UI
      const mapped = list.map(a => ({
        user: a.user,
        name: a.fullName || a.full_name || a.user || '',
        campaigns: Array.isArray(a.campaigns) ? a.campaigns.length : 0
      }));

      setAgents(mapped);
      // set totals from pagination
      const pagination = payload.pagination || { total: mapped.length };
      setTotals(t => ({ ...t, agents: pagination.total }));
      setPage(payload.pagination?.page || pageNum);
      setPageInput(String(payload.pagination?.page || pageNum));

      // fetch total campaigns sum separately (existing endpoint)
      try {
        const countsRes = await getWithCache(`/agents/campaigns/counts`, { ttl: 30_000 });
        const countsMap = countsRes?.data?.data || {};
        const totalCampaigns = Object.values(countsMap).reduce((sum, v) => sum + Number(v || 0), 0);
        setTotals(t => ({ ...t, campaigns: totalCampaigns }));
      } catch (err) {
        console.warn('counts fetch failed', err);
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
      await loadAgentsData(page);
      alert(`✅ Synced campaigns for ${res.data.data.agents_processed} agents! Total: ${res.data.data.total_campaigns} campaigns`);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('❌ Failed to sync campaigns: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(()=>{
    loadAgentsData(1);
  },[]);
  

  const handleRowClick = (agent) => {
    setSelectedAgent(agent);
    setView('campaigns');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      loadAgentsData(newPage);
    }
  };

  const handlePageInputChange = (e) => setPageInput(e.target.value);

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1) {
      loadAgentsData(pageNum);
    } else {
      setPageInput(String(page));
    }
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
                      <td className="py-4 px-6 text-gray-500">{(page - 1) * perPage + idx+1}</td>
                      <td className="py-4 px-6 font-mono text-sm text-blue-600 font-medium">{a.user}</td>
                      <td className="py-4 px-6 text-gray-900 font-medium">{a.name || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                          {typeof a.campaigns === 'number' ? a.campaigns : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Agents pagination controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-600">Total agents: {totals.agents}</div>
                <div className="flex items-center gap-4">
                  <button onClick={() => handlePageChange(page-1)} disabled={page===1} className="px-3 py-2 bg-white border rounded">Previous</button>
                  <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
                    <span className="text-sm">Page</span>
                    <input type="number" value={pageInput} onChange={handlePageInputChange} className="w-16 px-2 py-1 border rounded text-center" />
                    <span className="text-sm">of {Math.ceil(totals.agents / perPage) || 1}</span>
                  </form>
                  <button onClick={() => handlePageChange(page+1)} disabled={page >= Math.ceil(totals.agents / perPage)} className="px-3 py-2 bg-white border rounded">Next</button>
                </div>
              </div>
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
