import React from 'react';
import {
  ShieldExclamationIcon,
  CpuChipIcon,
  UsersIcon,
  ClockIcon,
  LinkIcon,
  TagIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/solid';
import ExpandableCard, { CardAction, CardSection } from './ExpandableCard';
import { UnsafeControlAction, UCCA, HardwareComponent, FailureMode, UnsafeInteraction } from '@/types';

interface UCACardProps {
  uca: UnsafeControlAction;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  controllerName?: string;
  actionName?: string;
  hazardCodes?: string[];
  compactMode?: boolean;
}

export const UCACard: React.FC<UCACardProps> = ({
  uca,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  controllerName,
  actionName,
  hazardCodes = [],
  compactMode = false
}) => {
  const getUCATypeColor = (type: string) => {
    switch (type) {
      case 'Not Provided': return 'danger';
      case 'Provided': return 'warning';
      case 'Wrong Timing': return 'info';
      case 'Wrong Duration': return 'neutral';
      default: return 'neutral';
    }
  };

  const actions: CardAction[] = [];
  if (onEdit) {
    actions.push({
      id: 'edit',
      label: 'Edit',
      onClick: onEdit,
      variant: 'secondary'
    });
  }
  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'danger'
    });
  }

  const metadata = [
    {
      label: 'Controller',
      value: controllerName || 'Unknown',
      icon: <UsersIcon className="w-4 h-4" />
    },
    {
      label: 'Control Action',
      value: actionName || 'Unknown',
      icon: <Cog6ToothIcon className="w-4 h-4" />
    },
    {
      label: 'UCA Type',
      value: uca.ucaType,
      icon: <TagIcon className="w-4 h-4" />
    }
  ];

  if (hazardCodes.length > 0) {
    metadata.push({
      label: 'Linked Hazards',
      value: hazardCodes.join(', '),
      icon: <ShieldExclamationIcon className="w-4 h-4" />
    });
  }

  const sections: CardSection[] = [];

  if (uca.context && !compactMode) {
    sections.push({
      id: 'context',
      title: 'Context & Conditions',
      content: (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {uca.context}
        </div>
      ),
      defaultExpanded: false
    });
  }

  return (
    <ExpandableCard
      id={uca.id}
      title={uca.code}
      subtitle={uca.context || 'No context provided'}
      statusBadge={{
        text: uca.ucaType,
        variant: getUCATypeColor(uca.ucaType) as any
      }}
      priority="medium"
      isSelected={isSelected}
      onClick={onSelect}
      actions={actions}
      sections={sections}
      metadata={metadata}
      compactMode={compactMode}
    />
  );
};

interface UCCACardProps {
  ucca: UCCA;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  controllerNames?: string[];
  hazardCodes?: string[];
  compactMode?: boolean;
}

export const UCCACard: React.FC<UCCACardProps> = ({
  ucca,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  controllerNames = [],
  hazardCodes = [],
  compactMode = false
}) => {
  const getUCCATypeColor = (type: string) => {
    switch (type) {
      case 'Team': return 'warning';
      case 'Role': return 'info';
      case 'Organizational': return 'neutral';
      case 'Temporal': return 'success';
      case 'CrossController': return 'danger';
      default: return 'neutral';
    }
  };

  const actions: CardAction[] = [];
  if (onEdit) {
    actions.push({
      id: 'edit',
      label: 'Edit',
      onClick: onEdit,
      variant: 'secondary'
    });
  }
  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'danger'
    });
  }

  const metadata = [
    {
      label: 'Controllers',
      value: controllerNames.join(' & ') || 'Multiple',
      icon: <UsersIcon className="w-4 h-4" />
    },
    {
      label: 'UCCA Type',
      value: ucca.uccaType,
      icon: <TagIcon className="w-4 h-4" />
    },
    {
      label: 'Temporal Relationship',
      value: ucca.temporalRelationship || 'Unknown',
      icon: <ClockIcon className="w-4 h-4" />
    }
  ];

  if (hazardCodes.length > 0) {
    metadata.push({
      label: 'Linked Hazards',
      value: hazardCodes.join(', '),
      icon: <ShieldExclamationIcon className="w-4 h-4" />
    });
  }

  const sections: CardSection[] = [];

  if (ucca.context && !compactMode) {
    sections.push({
      id: 'context',
      title: 'Context & Conditions',
      content: (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {ucca.context}
        </div>
      ),
      defaultExpanded: false
    });
  }

  return (
    <ExpandableCard
      id={ucca.id}
      title={ucca.code || `UCCA-${ucca.id.slice(0, 8)}`}
      subtitle={ucca.description}
      statusBadge={{
        text: ucca.uccaType,
        variant: getUCCATypeColor(ucca.uccaType) as any
      }}
      priority={ucca.isSystematic ? 'high' : 'medium'}
      isSelected={isSelected}
      onClick={onSelect}
      actions={actions}
      sections={sections}
      metadata={metadata}
      compactMode={compactMode}
    />
  );
};

interface HardwareComponentCardProps {
  component: HardwareComponent;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  failureModes?: FailureMode[];
  compactMode?: boolean;
}

export const HardwareComponentCard: React.FC<HardwareComponentCardProps> = ({
  component,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  failureModes = [],
  compactMode = false
}) => {
  const getComponentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mechanical': return 'neutral';
      case 'electrical': return 'info';
      case 'software': return 'success';
      case 'hydraulic': return 'warning';
      default: return 'neutral';
    }
  };

  const criticalFailures = failureModes.filter(fm => fm.severityLevel === 'Critical').length;
  const highFailures = failureModes.filter(fm => fm.severityLevel === 'High').length;

  const actions: CardAction[] = [];
  if (onEdit) {
    actions.push({
      id: 'edit',
      label: 'Edit',
      onClick: onEdit,
      variant: 'secondary'
    });
  }
  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'danger'
    });
  }

  const metadata = [
    {
      label: 'Component Type',
      value: component.type,
      icon: <CpuChipIcon className="w-4 h-4" />
    },
    {
      label: 'Failure Modes',
      value: `${failureModes.length} identified`,
      icon: <WrenchScrewdriverIcon className="w-4 h-4" />
    }
  ];

  if (criticalFailures > 0 || highFailures > 0) {
    metadata.push({
      label: 'High-Risk Failures',
      value: `${criticalFailures + highFailures} critical/high`,
      icon: <ExclamationTriangleIcon className="w-4 h-4" />
    });
  }

  const sections: CardSection[] = [];

  if (component.description && !compactMode) {
    sections.push({
      id: 'description',
      title: 'Description',
      content: (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {component.description}
        </div>
      ),
      defaultExpanded: false
    });
  }

  if (failureModes.length > 0 && !compactMode) {
    sections.push({
      id: 'failure-modes',
      title: 'Failure Modes',
      badge: {
        text: `${failureModes.length}`,
        variant: criticalFailures > 0 ? 'danger' : highFailures > 0 ? 'warning' : 'info'
      },
      content: (
        <div className="space-y-2">
          {failureModes.slice(0, 5).map(fm => (
            <div key={fm.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {fm.description}
                </span>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {fm.failureType} • {fm.severityLevel} Severity
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                fm.severityLevel === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                fm.severityLevel === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                fm.severityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              }`}>
                {fm.severityLevel}
              </span>
            </div>
          ))}
          {failureModes.length > 5 && (
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
              ... and {failureModes.length - 5} more
            </div>
          )}
        </div>
      ),
      defaultExpanded: false
    });
  }

  const priority = criticalFailures > 0 ? 'critical' : 
                  highFailures > 0 ? 'high' : 
                  failureModes.length > 3 ? 'medium' : 'low';

  return (
    <ExpandableCard
      id={component.id}
      title={component.name}
      subtitle={component.description}
      statusBadge={{
        text: component.type,
        variant: getComponentTypeColor(component.type) as any
      }}
      priority={priority}
      isSelected={isSelected}
      onClick={onSelect}
      actions={actions}
      sections={sections}
      metadata={metadata}
      compactMode={compactMode}
    />
  );
};

interface UnsafeInteractionCardProps {
  interaction: UnsafeInteraction;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  sourceComponentName?: string;
  affectedComponentNames?: string[];
  hazardCodes?: string[];
  compactMode?: boolean;
}

export const UnsafeInteractionCard: React.FC<UnsafeInteractionCardProps> = ({
  interaction,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  sourceComponentName,
  affectedComponentNames = [],
  hazardCodes = [],
  compactMode = false
}) => {
  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'Cascading': return 'danger';
      case 'Blocking': return 'warning';
      case 'Common Cause': return 'info';
      case 'Environmental': return 'neutral';
      default: return 'neutral';
    }
  };

  const actions: CardAction[] = [];
  if (onEdit) {
    actions.push({
      id: 'edit',
      label: 'Edit',
      onClick: onEdit,
      variant: 'secondary'
    });
  }
  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'danger'
    });
  }

  const metadata = [
    {
      label: 'Source Component',
      value: sourceComponentName || 'Unknown',
      icon: <CpuChipIcon className="w-4 h-4" />
    },
    {
      label: 'Affected Components',
      value: affectedComponentNames.length > 0 ? affectedComponentNames.join(', ') : 'None',
      icon: <LinkIcon className="w-4 h-4" />
    },
    {
      label: 'Interaction Type',
      value: interaction.interactionType,
      icon: <TagIcon className="w-4 h-4" />
    }
  ];

  if (hazardCodes.length > 0) {
    metadata.push({
      label: 'Linked Hazards',
      value: hazardCodes.join(', '),
      icon: <ShieldExclamationIcon className="w-4 h-4" />
    });
  }

  const sections: CardSection[] = [];

  if (interaction.description && !compactMode) {
    sections.push({
      id: 'description',
      title: 'Interaction Description',
      content: (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {interaction.description}
        </div>
      ),
      defaultExpanded: false
    });
  }

  const priority = interaction.interactionType === 'Cascading' ? 'high' :
                  interaction.interactionType === 'Blocking' ? 'medium' : 'low';

  return (
    <ExpandableCard
      id={interaction.id}
      title={`${sourceComponentName} → ${affectedComponentNames.join(', ')}`}
      subtitle={interaction.description}
      statusBadge={{
        text: interaction.interactionType,
        variant: getInteractionTypeColor(interaction.interactionType) as any
      }}
      priority={priority}
      isSelected={isSelected}
      onClick={onSelect}
      actions={actions}
      sections={sections}
      metadata={metadata}
      compactMode={compactMode}
    />
  );
};