import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChartIcon } from 'lucide-react';
import { useEventsStore } from '../../../store/eventsStore';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const CapacityUtilizationWidget: React.FC = () => {
  const { events } = useEventsStore();

  const dateRange = {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  };

  const capacityData = useMemo(() => {
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= dateRange.start && eventDate <= dateRange.end && event.isActive;
    });

    return filteredEvents.map(event => {
      const bookedCount = event.reservations?.filter(r => 
        r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
      ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
      
      return {
        date: format(new Date(event.date), 'dd MMM'),
        capacity: event.capacity,
        booked: bookedCount,
        available: event.capacity - bookedCount,
        utilization: Math.round((bookedCount / event.capacity) * 100)
      };
    });
  }, [events, dateRange]);

  const avgUtilization = capacityData.length > 0
    ? Math.round(capacityData.reduce((sum, d) => sum + d.utilization, 0) / capacityData.length)
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-blue-400" />
          Bezettingsgraad
        </h3>
        <p className="text-sm text-neutral-400 mt-1">
          Gemiddeld: {avgUtilization}% bezet
        </p>
      </div>

      <div className="bg-neutral-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={capacityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9CA3AF" 
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ color: '#9CA3AF' }} />
            <Bar dataKey="booked" fill="#3B82F6" name="Geboekt" />
            <Bar dataKey="available" fill="#6B7280" name="Beschikbaar" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
