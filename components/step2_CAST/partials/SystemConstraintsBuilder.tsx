import React from 'react';
import { SystemConstraint, Hazard, AnalysisType } from '../../../types';
import Textarea from '../../shared/Textarea';

interface SystemConstraintsBuilderProps {
    analysisType: AnalysisType;
    systemConstraints: SystemConstraint[];
    hazards: Hazard[];
    updateSystemConstraint: (id: string, updates: Partial<SystemConstraint>) => void;
}

const SystemConstraintsBuilder: React.FC<SystemConstraintsBuilderProps> = ({
                                                                               analysisType,
                                                                               systemConstraints,
                                                                               hazards,
                                                                               updateSystemConstraint,
                                                                           }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                {analysisType === AnalysisType.CAST ? "5. Elicit Safety Constraints from Hazards" : "4. Define System Safety Constraints from Hazards"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Safety constraints express the positive requirements for safe operation derived from each hazard. These are auto-generated but can be refined.</p>
            {systemConstraints.length > 0 ? (
                <ul className="space-y-2">
                    {systemConstraints.map(sc => (
                        <li key={sc.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <Textarea label={`${sc.code}: (Derived from Hazard ${hazards.find(h => h.id === sc.hazardId)?.code || 'N/A'})`} value={sc.text} onChange={(e) => updateSystemConstraint(sc.id, { text: e.target.value })} rows={2} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No hazards defined yet. Constraints will appear here once hazards are added.</p>
            )}
        </div>
    );
};

export default SystemConstraintsBuilder;