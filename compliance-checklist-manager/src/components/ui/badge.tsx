import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // Compliance-specific variants
        excellent: 'border-transparent bg-compliance-excellent text-white hover:bg-compliance-excellent/80',
        good: 'border-transparent bg-compliance-good text-white hover:bg-compliance-good/80',
        warning: 'border-transparent bg-compliance-warning text-white hover:bg-compliance-warning/80',
        poor: 'border-transparent bg-compliance-poor text-white hover:bg-compliance-poor/80',
        critical: 'border-transparent bg-compliance-critical text-white hover:bg-compliance-critical/80',
        // Status variants
        pending: 'border-transparent bg-status-pending text-white hover:bg-status-pending/80',
        inProgress: 'border-transparent bg-status-inProgress text-white hover:bg-status-inProgress/80',
        completed: 'border-transparent bg-status-completed text-white hover:bg-status-completed/80',
        overdue: 'border-transparent bg-status-overdue text-white hover:bg-status-overdue/80',
        // Risk variants
        lowRisk: 'border-transparent bg-risk-low text-white hover:bg-risk-low/80',
        mediumRisk: 'border-transparent bg-risk-medium text-white hover:bg-risk-medium/80',
        highRisk: 'border-transparent bg-risk-high text-white hover:bg-risk-high/80',
        criticalRisk: 'border-transparent bg-risk-critical text-white hover:bg-risk-critical/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };