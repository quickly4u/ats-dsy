import React from 'react';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  TrendingUp,
  UserPlus,
  Target
} from 'lucide-react';
import { useRecruitmentMetrics } from '../../hooks/useRecruitmentData';
import MetricCard from '../common/MetricCard';
import Chart from '../common/Chart';
import RecentActivity from './RecentActivity';
import TopPerformers from './TopPerformers';

const Dashboard: React.FC = () => {
  const { metrics, isLoading } = useRecruitmentMetrics();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sourceData = metrics ? {
    labels: Object.keys(metrics.sourceEffectiveness),
    datasets: [{
      label: 'Conversion Rate',
      data: Object.values(metrics.sourceEffectiveness).map(rate => rate * 100),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }]
  } : null;

  const timelineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Applications',
        data: [65, 78, 90, 81, 95, 105],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
      {
        label: 'Hires',
        data: [4, 6, 8, 7, 9, 12],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Jobs"
          value={metrics?.activeJobs || 0}
          change={12}
          changeType="positive"
          icon={Briefcase}
          color="blue"
        />
        <MetricCard
          title="New Applications"
          value={metrics?.newApplications || 0}
          change={8}
          changeType="positive"
          icon={UserPlus}
          color="green"
        />
        <MetricCard
          title="Interviews Scheduled"
          value={metrics?.interviewsScheduled || 0}
          change={-3}
          changeType="negative"
          icon={Calendar}
          color="purple"
        />
        <MetricCard
          title="Offers Extended"
          value={metrics?.offersExtended || 0}
          change={25}
          changeType="positive"
          icon={Target}
          color="orange"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <MetricCard
          title="Avg. Time to Hire"
          value={`${metrics?.averageTimeToHire || 0} days`}
          change={-2}
          changeType="positive"
          icon={Clock}
          color="indigo"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${((metrics?.applicationConversionRate || 0) * 100).toFixed(1)}%`}
          change={1.2}
          changeType="positive"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Timeline Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recruitment Timeline
          </h3>
          {timelineData && (
            <Chart 
              type="line" 
              data={timelineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
              height={300}
            />
          )}
        </div>

        {/* Source Effectiveness Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Source Effectiveness
          </h3>
          {sourceData && (
            <Chart 
              type="bar" 
              data={sourceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  },
                },
              }}
              height={300}
            />
          )}
        </div>
      </div>

      {/* Activity and Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <TopPerformers />
      </div>
    </div>
  );
};

export default Dashboard;