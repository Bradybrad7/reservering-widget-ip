import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';

const COLORS = ['#D4AF37', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export const ArrangementDistributionWidget: React.FC = () => {
  const { reservations } = useReservationsStore();

  const arrangementData = useMemo(() => {
    const byArrangement = reservations.reduce((acc, res) => {
      acc[res.arrangement] = (acc[res.arrangement] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byArrangement).map(([name, value]) => ({
      name,
      value
    }));
  }, [reservations]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-gold-400" />
          Reserveringen per Arrangement
        </h3>
        <p className="text-sm text-neutral-400 mt-1">
          Verdeling over alle arrangementen
        </p>
      </div>

      <div className="bg-neutral-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={arrangementData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {arrangementData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#9CA3AF' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
