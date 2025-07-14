import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Card from '@/components/shared/Card';
import { AlertOctagon, Users, Clock } from 'lucide-react';
import { UCCAType } from '@/types';

export interface UCCANodeData {
  label: string;
  uccaType: UCCAType;
  context: string;
  hazards: string[];
  code: string;
  description: string;
  involvedControllers: string[];
  temporalRelationship?: string;
  isSystematic?: boolean;
}

const uccaTypeIcons: Record<UCCAType, React.ReactNode> = {
  [UCCAType.Team]: <Users className="h-3 w-3" />,
  [UCCAType.Role]: <Users className="h-3 w-3" />,
  [UCCAType.Organizational]: <Users className="h-3 w-3" />,
  [UCCAType.CrossController]: <AlertOctagon className="h-3 w-3" />,
  [UCCAType.Temporal]: <Clock className="h-3 w-3" />,
};

const uccaTypeColors: Record<UCCAType, string> = {
  [UCCAType.Team]: 'bg-blue-500',
  [UCCAType.Role]: 'bg-green-500',
  [UCCAType.Organizational]: 'bg-purple-500',
  [UCCAType.CrossController]: 'bg-orange-500',
  [UCCAType.Temporal]: 'bg-yellow-500',
};

const UCCANode: React.FC<NodeProps<UCCANodeData>> = memo(({ data, selected }) => {
  const typeIcon = uccaTypeIcons[data.uccaType];
  const typeColor = uccaTypeColors[data.uccaType] || 'bg-gray-500';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-orange-500" />
      <Card className={`min-w-[220px] max-w-[320px] p-3 transition-all border-orange-200 hover:shadow-md ${selected ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}>
        <div className="flex items-start gap-2 mb-2">
          <AlertOctagon className="h-4 w-4 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{data.code}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                UCCA
              </span>
              {data.isSystematic && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-300 text-slate-700">
                  Systematic
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">
              {data.description}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${typeColor}`} />
            <span className="text-xs text-slate-600 flex items-center gap-1">
              {typeIcon}
              {data.uccaType}
            </span>
          </div>
          
          {data.temporalRelationship && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-300 text-slate-700">
              <Clock className="h-3 w-3 mr-1" />
              {data.temporalRelationship}
            </span>
          )}
          
          {data.involvedControllers.length > 0 && (
            <div className="text-xs text-slate-600">
              <span className="font-medium">Controllers:</span> {data.involvedControllers.length}
            </div>
          )}
          
          {data.hazards.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.hazards.slice(0, 2).map((hazard, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  {hazard}
                </span>
              ))}
              {data.hazards.length > 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-300 text-slate-700">
                  +{data.hazards.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500" />
    </>
  );
});

UCCANode.displayName = 'UCCANode';

export default UCCANode;