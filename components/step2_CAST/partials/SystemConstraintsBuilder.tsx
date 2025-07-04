// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step2_CAST/partials/SystemConstraintsBuilder.tsx
import React from 'react';
import { SystemConstraint, Hazard, AnalysisType } from '../../../types';
import Textarea from '../../shared/Textarea';
import CastStepLayout from './CastStepLayout';

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
    const title = "Define Safety Constraints";
    const description = (
        <>
            For every unsafe situation (Hazard), there's a safety rule (Constraint) that prevents it.
            <br />
            We've auto-generated these based on your hazards. Please review and refine them.
        </>
    );
    return (
        <CastStepLayout title={title} description={description}>
            {systemConstraints.length > 0 ? (
                <ul className="space-y-4">
                    {systemConstraints.map(sc => (
                        <li key={sc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/50">
                            <label htmlFor={sc.id} className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                {sc.code}: (Derived from Hazard {hazards.find(h => h.id === sc.hazardId)?.code || 'N/A'})
                            </label>
                            <Textarea
                                id={sc.id}
                                value={sc.text}
                                onChange={(e) => updateSystemConstraint(sc.id, { text: e.target.value })}
                                rows={2}
                                className="text-base !mb-0"
                                containerClassName="!mb-0"
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                    <p className="text-sm text-slate-500">No hazards defined yet. Constraints will appear here once hazards are added.</p>
                </div>
            )}
        </CastStepLayout>
    );
};

export default SystemConstraintsBuilder;