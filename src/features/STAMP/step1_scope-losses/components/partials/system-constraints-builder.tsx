import React from 'react';
import { Textarea } from '@/components/shared';
import { SystemConstraint, Hazard, AnalysisType } from '@/types/types';
import CastStepLayout from './cast-step-layout';

interface SystemConstraintsBuilderProps {
  analysisType: AnalysisType;
  systemConstraints: SystemConstraint[];
  hazards: Hazard[];
  updateSystemConstraint: (id: string, updates: Partial<SystemConstraint>) => void;
}

const SystemConstraintsBuilder: React.FC<SystemConstraintsBuilderProps> = ({
  systemConstraints,
  hazards,
  updateSystemConstraint,
}) => {
  const title = 'Define Safety Constraints';
  const description = (
    <>
      For every unsafe situation (Hazard), there&apos;s a safety rule (Constraint) that prevents it.
      <br />
      We&apos;ve auto-generated these based on your hazards. Please review and refine them.
    </>
  );
  return (
    <CastStepLayout title={title} description={description}>
      {systemConstraints.length > 0 ? (
        <ul className="space-y-4">
          {systemConstraints.map(sc => (
            <li
              key={sc.id}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <label
                htmlFor={sc.id}
                className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400"
              >
                {sc.code}: (Derived from Hazard{' '}
                {hazards.find(h => h.id === sc.hazardId)?.code || 'N/A'})
              </label>
              <Textarea
                id={sc.id}
                value={sc.text}
                onChange={e => updateSystemConstraint(sc.id, { text: e.target.value })}
                rows={2}
                className="!mb-0 text-base"
                containerClassName="!mb-0"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center dark:border-slate-600">
          <p className="text-sm text-slate-500">
            No hazards defined yet. Constraints will appear here once hazards are added.
          </p>
        </div>
      )}
    </CastStepLayout>
  );
};

export default SystemConstraintsBuilder;
