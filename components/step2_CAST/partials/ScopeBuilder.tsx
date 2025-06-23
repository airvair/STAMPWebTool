import React from 'react';
import { AnalysisType } from '../../../types';
import Textarea from '../../shared/Textarea';

interface ScopeBuilderProps {
    analysisType: AnalysisType;
    scope: string;
    setScope: (scope: string) => void;
    handleScopeBlur: () => void;
}

const ScopeBuilder: React.FC<ScopeBuilderProps> = ({
                                                       analysisType,
                                                       scope,
                                                       setScope,
                                                       handleScopeBlur,
                                                   }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                1. Define {analysisType === AnalysisType.CAST ? "Accident Scope & Boundaries" : "System Purpose, Scope & Boundaries"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{analysisType === AnalysisType.CAST ? "Describe the physical, functional, organisational and temporal boundaries of the investigation. Recommendations should address actors within these boundaries." : "Define the scope of your investigation based on the losses and hazards you have identified. This is normally limited to those individuals or entities who can implement your recommendations..."}</p>
            {analysisType === AnalysisType.CAST && (
                <ul className="list-disc ml-6 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <li>Out-of-scope: international ATC providers, third-party maintenance</li>
                </ul>
            )}
            {analysisType === AnalysisType.CAST && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Record the date, time and location of the occurrence.</p>
            )}
            <Textarea
                label={analysisType === AnalysisType.CAST ? "Describe the accident or incident being investigated." : "Describe the system and its purpose, including boundaries."}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                onBlur={handleScopeBlur}
                placeholder="Enter details here..."
                rows={3}
            />
        </div>
    );
};

export default ScopeBuilder;