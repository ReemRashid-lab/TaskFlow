import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

interface AnalyticsSummaryProps {
  tasks: any[];
}

export default function AnalyticsSummary({ tasks }: AnalyticsSummaryProps) {
  // 1. Task Status Distribution
  const statusData = [
    { name: 'Pending', value: tasks.filter(t => t.status === 'Pending').length, color: '#94a3b8' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, color: '#10b981' },
    { name: 'Resubmission', value: tasks.filter(t => t.status === 'Needs Resubmission').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // 2. Activity by Day (Tasks completed in last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const activityData = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    completed: tasks.filter(t => t.status === 'Completed' && t.updatedAt?.startsWith(date)).length,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Status Distribution */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Task Status Overview</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion Activity */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Daily Completion Trends</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
