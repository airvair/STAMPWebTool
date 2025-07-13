import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Card from '@/components/shared/Card';
import { Bot, User, Users, Building2 } from 'lucide-react';
import { ControllerType } from '@/types';
import { CONTROLLER_TYPE_COLORS } from '@/constants';

export interface ControllerNodeData {
  label: string;
  ctrlType: ControllerType;
  description?: string;
  responsibilities?: string;
  controlActionCount: number;
  ucaCount: number;
  isInvolvedInUCCA: boolean;
}

const controllerIcons: Record<ControllerType, React.ReactNode> = {
  [ControllerType.Software]: <Bot className="h-4 w-4" />,
  [ControllerType.Human]: <User className="h-4 w-4" />,
  [ControllerType.Team]: <Users className="h-4 w-4" />,
  [ControllerType.Organisation]: <Building2 className="h-4 w-4" />,
};

const ControllerNode: React.FC<NodeProps<ControllerNodeData>> = memo(({ data, selected }) => {
  const Icon = controllerIcons[data.ctrlType];
  const typeColorClass = CONTROLLER_TYPE_COLORS[data.ctrlType];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <Card className={`min-w-[180px] max-w-[280px] p-3 transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      } ${data.isInvolvedInUCCA ? 'border-orange-300' : ''}`}>
        <div className="flex items-start gap-2 mb-2">
          <div className={`p-1.5 rounded ${typeColorClass}`}>
            {Icon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{data.label}</h4>
            {data.description && (
              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                {data.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-800">
            {data.ctrlType}
          </span>
          
          {data.controlActionCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-300 text-slate-700">
              {data.controlActionCount} Actions
            </span>
          )}
          
          {data.ucaCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              {data.ucaCount} UCAs
            </span>
          )}
          
          {data.isInvolvedInUCCA && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
              UCCA
            </span>
          )}
        </div>
        
        {data.responsibilities && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-slate-600">
              <span className="font-medium">Responsibilities:</span> {data.responsibilities}
            </p>
          </div>
        )}
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </>
  );
});

ControllerNode.displayName = 'ControllerNode';

export default ControllerNode;