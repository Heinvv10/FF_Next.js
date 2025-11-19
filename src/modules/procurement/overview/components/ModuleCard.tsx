// ============= Module Card Component =============

import { ArrowRight } from 'lucide-react';
import { Button } from '@/src/shared/components/ui/Button';
import type { ModuleCard as ModuleCardType, QuickAction } from '../types/types';

interface ModuleCardProps {
  card: ModuleCardType;
  isDisabled: boolean;
  onNavigate: (path: string) => void;
}

export function ModuleCard({ card, isDisabled, onNavigate }: ModuleCardProps) {
  const Icon = card.icon;

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 overflow-hidden
        transition-all duration-200 hover:shadow-lg
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}
      `}
      onClick={() => !isDisabled && onNavigate(`/app/procurement/${card.id}`)}
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex p-3 rounded-lg ${card.color} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) onNavigate(`/app/procurement/${card.id}`);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDisabled}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{card.description}</p>
      </div>

      {/* Metrics Grid */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {card.metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className={`text-lg font-bold ${
                metric.status === 'success' ? 'text-green-600' :
                metric.status === 'warning' ? 'text-yellow-600' :
                metric.status === 'error' ? 'text-red-600' :
                metric.status === 'info' ? 'text-blue-600' :
                'text-gray-900'
              }`}>
                {metric.format === 'currency' && 'R '}
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                {metric.format === 'percentage' && '%'}
              </div>
              <div className="text-xs text-gray-500">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex gap-2">
          {card.quickActions.slice(0, 2).map((action: QuickAction, index: number) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) action.onClick();
                }}
                disabled={isDisabled}
                className="flex-1 text-xs"
              >
                <ActionIcon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
