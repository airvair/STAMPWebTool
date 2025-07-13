import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Card from '@/components/shared/Card';
import { AlertTriangle, Link } from 'lucide-react';

export interface HazardNodeData {
  label: string;
  code: string;
  title: string;
  systemComponent?: string;
  environmentalCondition?: string;
  systemState?: string;
  severity?: string;
  linkedUCACount: number;
  linkedUCCACount: number;
  linkedLossCount: number;
}

const severityColors: Record<string, string> = {
  'Low': 'bg-yellow-500',
  'Medium': 'bg-orange-500',
  'High': 'bg-red-500',
  'Critical': 'bg-red-700',
};

const HazardNode: React.FC<NodeProps<HazardNodeData>> = memo(({ data, selected }) => {
  const severityColor = data.severity ? severityColors[data.severity] || 'bg-gray-500' : 'bg-gray-500';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-yellow-500" />
      <Card className={`min-w-[200px] max-w-[300px] p-3 transition-all border-yellow-200 hover:shadow-md ${
        selected ? 'ring-2 ring-yellow-500 shadow-lg' : ''
      }`}>
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{data.code}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Hazard
              </span>
            </div>
            <h4 className="text-sm font-medium">{data.title}</h4>
          </div>
        </div>
        
        <div className="space-y-1 text-xs text-slate-600">
          {data.systemComponent && (
            <div>
              <span className="font-medium">Component:</span> {data.systemComponent}
            </div>
          )}
          
          {data.environmentalCondition && (
            <div>
              <span className="font-medium">Environment:</span> {data.environmentalCondition}
            </div>
          )}
          
          {data.systemState && (
            <div>
              <span className="font-medium">State:</span> {data.systemState}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
          {data.severity && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-300 text-slate-700">
              <div className={`w-2 h-2 rounded-full mr-1 ${severityColor}`} />
              {data.severity}
            </span>
          )}
          
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Link className="h-3 w-3" />
            <span>{data.linkedUCACount} UCAs</span>
            {data.linkedUCCACount > 0 && (
              <span className="ml-1">· {data.linkedUCCACount} UCCAs</span>
            )}
            {data.linkedLossCount > 0 && (
              <span className="ml-1">· {data.linkedLossCount} Losses</span>
            )}
          </div>
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500" />
    </>
  );
});

HazardNode.displayName = 'HazardNode';

export default HazardNode;