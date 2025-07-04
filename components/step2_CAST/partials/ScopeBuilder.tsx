import React from 'react';
import { AnalysisType } from '../../../types';
import Textarea from '../../shared/Textarea';
import CastStepLayout from './CastStepLayout';

interface ScopeBuilderProps {
    analysisType: AnalysisType;
    scope: string;
    setScope: (scope: string) => void;
    handleScopeBlur: () => void;
}

const ScopeBuilder: React.FC<ScopeBuilderProps> = ({
                                                       scope,
                                                       setScope,
                                                       handleScopeBlur,
                                                   }) => {
    const title = "Define the Investigation Scope";
    const description = (
        <>
            Let's start by drawing the map for our investigation. What are the boundaries?
            <br />
            This defines what's 'in-play' and helps focus our efforts on what we can actually influence.
        </>
    );

    return (
        <CastStepLayout title={title} description={description}>
            <Textarea
                label="Scope & Boundaries"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                onBlur={handleScopeBlur}
                placeholder="Describe the physical, functional, organisational, and temporal boundaries of the investigation. Record the date, time, and location if applicable."
                rows={5}
                className="text-base"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Example: This investigation covers the flight crew and air traffic controllers involved in the landing incident at XYZ airport on Jan 1, 2024. It excludes third-party maintenance providers and aircraft manufacturers.
            </p>
        </CastStepLayout>
    );
};

export default ScopeBuilder;