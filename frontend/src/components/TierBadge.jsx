import React from 'react';
import { Award, Sparkles, Shield, Gem } from 'lucide-react';

export default function TierBadge({ tier = 'Silver', showIcon = true, size = 'sm' }) {
  const configs = {
    Silver: {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Shield,
      label: 'Silver Tier'
    },
    Gold: {
      bg: 'bg-amber-50 text-amber-700 border-amber-300',
      icon: Award,
      label: 'Gold Tier'
    },
    Platinum: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      icon: Sparkles,
      label: 'Platinum Tier'
    },
    Diamond: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm',
      icon: Gem,
      label: 'Diamond Tier'
    }
  };

  const config = configs[tier] || configs.Silver;
  const IconComponent = config.icon;

  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1 font-medium',
    md: 'text-sm px-3 py-1.5 font-semibold'
  }[size] || 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}>
      {showIcon && <IconComponent className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{tier}</span>
    </span>
  );
}

