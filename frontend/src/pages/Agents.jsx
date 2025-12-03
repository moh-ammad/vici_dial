import React, { useEffect, useState } from 'react';
import api, { getWithCache } from '../api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AgentCampaignsPanel from '../components/AgentCampaignsPanel';
import AgentStatsPanel from '../components/AgentStatsPanel';

export default function Agents(){
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [totals, setTotals] = useState({agents:0, campaigns:0, active:0});
  const [view, setView] = useState('list'); // 'list' | 'campaigns' | 'stats'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const perPage = 8;
  
  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

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
        campaigns: Array.isArray(a.campaigns) ? a.campaigns.length : 0,
        isActive: a.isActive || false
      }));

      setAgents(mapped);
      // set totals from pagination
      const pagination = payload.pagination || { total: mapped.length };
      const activeCount = mapped.filter(a => a.isActive).length;
      setTotals(t => ({ ...t, agents: pagination.total, active: activeCount }));
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
      // Pass date range to sync if available
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      
      const res = await api.get('/agents/campaigns/sync-all', { params });
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

  const handleDateApply = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    loadAgentsData(1); // Reset to page 1 when filters change
  };

  const handleDateClear = () => {
    setTempStartDate('');
    setTempEndDate('');
    setStartDate('');
    setEndDate('');
    loadAgentsData(1);
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

          {/* Date Range Filter */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input 
                  type="date" 
                  value={tempStartDate} 
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="dd-mm-yyyy"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input 
                  type="date" 
                  value={tempEndDate} 
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="dd-mm-yyyy"
                />
              </div>
              <button 
                onClick={handleDateApply}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Apply
              </button>
              <button 
                onClick={handleDateClear}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Agents" value={totals.agents} color="blue" />
            <MetricCard title="Total Campaigns (sum)" value={totals.campaigns} color="green" />
            <MetricCard title="Live Agents" value={totals.active} color="dark" />
            <MetricCard title="Inactive" value={totals.agents - totals.active} color="green" />
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
                    <th className="py-4 px-6 text-left">Status</th>
                    <th className="py-4 px-6 text-left">Agent ID</th>
                    <th className="py-4 px-6 text-left">Agent Name</th>
                    <th className="py-4 px-6 text-left">Campaigns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {agents.map((a, idx) => (
                    <tr key={a.user || idx} className="cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleRowClick(a)}>
                      <td className="py-4 px-6 text-gray-500">{(page - 1) * perPage + idx+1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${a.isActive ? 'bg-green-500' : 'bg-gray-300'}`} title={a.isActive ? 'Active' : 'Inactive'}></div>
                          <span className={`text-sm font-medium ${a.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                            {a.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full shadow-sm hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Page</span>
                    <input
                      type="number"
                      min="1"
                      max={Math.ceil(totals.agents / perPage) || 1}
                      value={pageInput}
                      onChange={handlePageInputChange}
                      className="w-16 px-3 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm shadow-sm"
                    />
                    <span className="text-sm text-gray-600 font-medium">of {Math.ceil(totals.agents / perPage) || 1}</span>
                  </form>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(totals.agents / perPage)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full shadow-sm hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                  >
                    Next <ChevronRight size={16} />
                  </button>
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
