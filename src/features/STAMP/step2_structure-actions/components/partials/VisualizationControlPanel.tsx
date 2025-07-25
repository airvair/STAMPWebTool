import React from 'react';
import Select from '@/components/shared/Select';
import { useAnalysis } from '@/hooks/useAnalysis';
import { ControllerType } from '@/types/types';
import { WorkspaceVisualizationState } from '../workspace/hooks/useWorkspaceState';

interface VisualizationControlPanelProps {
    visualizationState?: WorkspaceVisualizationState;
    onVisualizationStateChange?: (newState: Partial<WorkspaceVisualizationState>) => void;
}

const VisualizationControlPanel: React.FC<VisualizationControlPanelProps> = ({ 
    visualizationState, 
    onVisualizationStateChange 
}) => {
    const { controllers, activeContexts, setActiveContext } = useAnalysis();

    const teamControllersWithContexts = controllers.filter(c =>
        c.ctrlType === ControllerType.Team &&
        !c.teamDetails?.isSingleUnit &&
        c.teamDetails?.contexts && c.teamDetails.contexts.length > 0
    );

    const hasTeamContexts = teamControllersWithContexts.length > 0;
    const showFailurePathsToggle = visualizationState && onVisualizationStateChange;

    if (!hasTeamContexts && !showFailurePathsToggle) {
        return null; // Don't render if there are no controls to show
    }

    return (
        <section className="p-4 flex-shrink-0">
            <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Visualization Controls</h3>
            
            {/* Failure Paths Toggle */}
            {showFailurePathsToggle && (
                <div className="mb-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500"
                            checked={visualizationState.showFailurePaths}
                            onChange={(e) => onVisualizationStateChange({ showFailurePaths: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                            Show Failure Propagation Links
                        </span>
                    </label>
                </div>
            )}
            
            {/* Team Context Controls */}
            {hasTeamContexts && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-2">
                {teamControllersWithContexts.map(team => {
                    const options = team.teamDetails!.contexts.map(ctx => ({
                        value: ctx.id,
                        label: ctx.name,
                    }));

                    return (
                        <Select
                            key={team.id}
                            label={`Context for "${team.name}":`}
                            value={activeContexts[team.id] || ''}
                            onChange={(e) => setActiveContext(team.id, e.target.value)}
                            options={[{value: '', label: 'Select Context...'}, ...options]}
                            containerClassName="!mb-0"
                        />
                    );
                })}
            </div>
            )}
        </section>
    );
};

export default VisualizationControlPanel;