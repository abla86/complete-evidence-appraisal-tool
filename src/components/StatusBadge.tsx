import React from 'react';
import { AssessmentStatus } from '../types';
import { CheckCircle2, HelpCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react';

interface StatusBadgeProps {
  status?: AssessmentStatus | string;
  verdict?: 'Inkluder' | 'Ekskluder' | 'SÃ¸k mer informasjon' | 'Vurder videre' | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  verdict,
  size = 'md',
  showLabel = true
}) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const effectiveValue = (verdict || status || 'Uklart').toString();

  switch (effectiveValue) {
    case 'Ja':
    case 'Yes':
    case 'Inkluder':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 ${
            isSmall ? 'px-2 py-0.5 text-xs' : isLarge ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className={`${isSmall ? 'w-3.5 h-3.5' : isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600`} />
          {showLabel && effectiveValue}
        </span>
      );
    case 'Ja, med forbehold':
    case 'Vurder videre':
    case 'SÃ¸k mer informasjon':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-teal-50 text-teal-800 border border-teal-200 ${
            isSmall ? 'px-2 py-0.5 text-xs' : isLarge ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <AlertCircle className={`${isSmall ? 'w-3.5 h-3.5' : isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-teal-600`} />
          {showLabel && effectiveValue}
        </span>
      );
    case 'Uklart':
    case 'Unclear':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${
            isSmall ? 'px-2 py-0.5 text-xs' : isLarge ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <HelpCircle className={`${isSmall ? 'w-3.5 h-3.5' : isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-amber-600`} />
          {showLabel && effectiveValue}
        </span>
      );
    case 'Nei':
    case 'No':
    case 'Ekskluder':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200 ${
            isSmall ? 'px-2 py-0.5 text-xs' : isLarge ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <XCircle className={`${isSmall ? 'w-3.5 h-3.5' : isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-rose-600`} />
          {showLabel && effectiveValue}
        </span>
      );
    case 'Ikke relevant':
    case 'Not applicable':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${
            isSmall ? 'px-2 py-0.5 text-xs' : isLarge ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <MinusCircle className={`${isSmall ? 'w-3.5 h-3.5' : isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-slate-500`} />
          {showLabel && effectiveValue}
        </span>
      );
  }
};

