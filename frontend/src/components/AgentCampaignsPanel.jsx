import React, { useEffect, useState, useCallback } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import api from '../api';
import BackButton from './BackButton';

export default function AgentCampaignsPanel({ agentUser, agentName, onBack, onShowStats }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const perPage = 8;

  const loadData = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const r = await api.get(`/agents/campaigns/paginated?agent_user=${encodeURIComponent(agentUser)}&page=${pageNum}&perPage=${perPage}`);
      setData(r?.data?.data || {});
      setPage(pageNum);
      setPageInput(String(pageNum));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [agentUser]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.totalPages || 1)) {
      loadData(newPage);
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= (data?.pagination?.totalPages || 1)) {
      loadData(pageNum);
    } else {
      setPageInput(String(page));
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  const campaigns = data?.campaigns || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-sm font-medium opacity-90">Total Campaigns</div>
          <div className="text-4xl font-bold mt-2">{pagination.total || 0}</div>
        </div>
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-sm font-medium opacity-90">Agent ID</div>
          <div className="text-3xl font-bold mt-2">{agentUser}</div>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="text-sm font-medium opacity-90">Current Page</div>
          <div className="text-3xl font-bold mt-2">{pagination.page} / {pagination.totalPages}</div>
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
                  <td className="py-4 px-6 text-gray-500">{(pagination.page - 1) * perPage + idx + 1}</td>
                  <td className="py-4 px-6 font-mono text-sm text-blue-600 font-medium">{c.id}</td>
                  <td className="py-4 px-6 text-gray-900">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * perPage) + 1} to {Math.min(pagination.page * perPage, pagination.total)} of {pagination.total} campaigns
            </div>

            <div className="flex items-center gap-4">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Previous
              </button>

              {/* Page Number Input */}
              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Page</span>
                <input
                  type="number"
                  min="1"
                  max={pagination.totalPages}
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputSubmit}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <span className="text-sm text-gray-600 font-medium">of {pagination.totalPages}</span>
              </form>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">No campaigns</div>
      )}
    </div>
  )
}
