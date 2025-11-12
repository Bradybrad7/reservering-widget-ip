
import { CalendarPlus, Clock, FileDown, Users, Star } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { useReservationsStore } from '../../../store/reservationsStore';
import { cn } from '../../../utils';
import type { AdminSection } from '../../../types';

export const QuickActionsWidget: React.FC = () => {
  const { setActiveSection } = useAdminStore();
  const { reservations, bulkExport } = useReservationsStore();

  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  const quickActions = [
    {
      id: 'new-event' as AdminSection,
      label: 'Nieuw Event Aanmaken',
      icon: CalendarPlus,
      color: 'gold',
      action: () => setActiveSection('events')
    },
    {
      id: 'pending-reservations' as AdminSection,
      label: 'Pending Reserveringen',
      icon: Clock,
      color: 'orange',
      badge: pendingCount,
      action: () => setActiveSection('reservations')
    },
    {
      id: 'export-data' as AdminSection,
      label: 'Export Data',
      icon: FileDown,
      color: 'blue',
      action: async () => {
        const allIds = reservations.map(r => r.id);
        const blob = await bulkExport(allIds);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reserveringen-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    },
    {
      id: 'customers' as AdminSection,
      label: 'Klanten Beheer',
      icon: Users,
      color: 'purple',
      action: () => setActiveSection('customers')
    }
  ];

  const colorClasses = {
    gold: 'bg-gold-500 hover:bg-gold-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600'
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Star className="w-5 h-5 text-gold-400" />
        Snelle Acties
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              onClick={action.action}
              className={cn(
                'relative p-4 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg hover:scale-105',
                colorClasses[action.color as keyof typeof colorClasses]
              )}
            >
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                  {action.badge}
                </span>
              )}
              <Icon className="w-6 h-6 mb-2 mx-auto" />
              <div className="text-sm text-center">{action.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
