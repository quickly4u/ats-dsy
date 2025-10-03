import React, { useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Target
} from 'lucide-react';
import { useRecruitmentMetrics } from '../../hooks/useRecruitmentData';
import Chart from '../common/Chart';
import MetricCard from '../common/MetricCard';

const ReportsList: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState('overview');
  const { metrics, isLoading, error } = useRecruitmentMetrics();

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  const reportTypes = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'pipeline', name: 'Pipeline Analysis', icon: TrendingUp },
    { id: 'source', name: 'Source Effectiveness', icon: Target },
    { id: 'time', name: 'Time to Hire', icon: Clock },
    { id: 'cost', name: 'Cost Analysis', icon: DollarSign },
    { id: 'diversity', name: 'Diversity & Inclusion', icon: Users },
  ];

  // Pipeline data from real metrics
  const pipelineData = metrics ? {
    labels: metrics.pipelineData.labels,
    datasets: [{
      label: 'Candidates',
      data: metrics.pipelineData.counts,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }]
  } : null;

  // Time to hire data from real metrics
  const timeToHireData = metrics ? {
    labels: metrics.timeToHireTrend.labels,
    datasets: [{
      label: 'Average Days',
      data: metrics.timeToHireTrend.values,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 2,
      fill: true,
    }]
  } : null;

  const sourceEffectivenessData = metrics ? {
    labels: Object.keys(metrics.sourceEffectiveness),
    datasets: [{
      label: 'Conversion Rate (%)',
      data: Object.values(metrics.sourceEffectiveness).map(rate => rate * 100),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }]
  } : null;

  // Cost analysis data - placeholder until cost tracking is implemented
  const costAnalysisData = {
    labels: ['Recruiting Tools', 'Job Boards', 'Referral Bonuses', 'Agency Fees', 'Internal Costs'],
    datasets: [{
      label: 'Cost ($)',
      data: [5000, 3200, 2800, 8500, 4200],
      backgroundColor: 'rgba(245, 158, 11, 0.8)',
      borderColor: 'rgb(245, 158, 11)',
      borderWidth: 1,
    }]
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Applications"
          value={metrics?.totalApplications || 0}
          change={12}
          changeType="positive"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Avg. Time to Hire"
          value={`${metrics?.averageTimeToHire || 0} days`}
          change={-8}
          changeType="positive"
          icon={Clock}
          color="green"
        />
        <MetricCard
          title="Cost per Hire"
          value={`$${metrics?.costPerHire?.toLocaleString() || 0}`}
          change={-5}
          changeType="positive"
          icon={DollarSign}
          color="orange"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${((metrics?.applicationConversionRate || 0) * 100).toFixed(1)}%`}
          change={3.2}
          changeType="positive"
          icon={Target}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Funnel</h3>
          {pipelineData ? (
            <Chart type="bar" data={pipelineData} height={300} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No pipeline data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time to Hire Trend</h3>
          {timeToHireData ? (
            <Chart type="line" data={timeToHireData} height={300} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No time to hire data available
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSourceReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Effectiveness</h3>
        {sourceEffectivenessData && (
          <Chart type="bar" data={sourceEffectivenessData} height={400} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Top Performing Sources</h4>
          <div className="space-y-3">
            {metrics && Object.entries(metrics.sourceEffectiveness)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([source, rate], index) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{source}</span>
                  </div>
                  <span className="text-sm text-gray-600">{(rate * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Source Volume</h4>
          <div className="space-y-3">
            {metrics && Object.entries(metrics.sourceVolume)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([source, count], index) => {
                const maxCount = Math.max(...Object.values(metrics.sourceVolume));
                const percentage = (count / maxCount) * 100;
                const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-yellow-600', 'bg-pink-600'];
                return (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{source}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className={`${colors[index % colors.length]} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                );
              })}
            {(!metrics || Object.keys(metrics.sourceVolume).length === 0) && (
              <div className="text-center text-gray-400 py-4">No source data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCostReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
        <Chart type="bar" data={costAnalysisData} height={400} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Recruitment Cost"
          value={metrics ? `$${(metrics.costPerHire * metrics.hires).toLocaleString()}` : '$0'}
          change={-12}
          changeType="positive"
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Cost per Application"
          value={metrics && metrics.totalApplications > 0 ? `$${Math.round((metrics.costPerHire * metrics.hires) / metrics.totalApplications)}` : '$0'}
          change={-8}
          changeType="positive"
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Hires This Period"
          value={metrics?.hires.toString() || '0'}
          change={15}
          changeType="positive"
          icon={TrendingUp}
          color="purple"
        />
      </div>
    </div>
  );

  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'source':
        return renderSourceReport();
      case 'cost':
        return renderCostReport();
      case 'pipeline':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Analysis</h3>
            {pipelineData ? (
              <Chart type="bar" data={pipelineData} height={400} />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                No pipeline data available
              </div>
            )}
          </div>
        );
      case 'time':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Time to Hire Analysis</h3>
            {timeToHireData ? (
              <Chart type="line" data={timeToHireData} height={400} />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                No time to hire data available
              </div>
            )}
          </div>
        );
      case 'diversity':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Diversity & Inclusion Report</h3>
            <p className="text-gray-600">Advanced diversity analytics coming soon...</p>
          </div>
        );
      default:
        return renderOverviewReport();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Reports</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header actions moved into Controls below */}

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {reportTypes.map(report => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    selectedReport === report.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{report.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderSelectedReport()}
    </div>
  );
};

export default ReportsList;