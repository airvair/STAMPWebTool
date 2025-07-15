import React from 'react';
import Select from '@/components/shared/Select';
import { useAnalysis } from '@/hooks/useAnalysis';
import { ControllerType } from '@/types/types';

const VisualizationControlPanel: React.FC = () => {
    const { controllers, activeContexts, setActiveContext } = useAnalysis();

    const teamControllersWithContexts = controllers.filter(c =>
        c.ctrlType === ControllerType.Team &&
        !c.teamDetails?.isSingleUnit &&
        c.teamDetails?.contexts && c.teamDetails.contexts.length > 0
    );

    if (teamControllersWithContexts.length === 0) {
        return null; // Don't render if there are no teams with contexts to configure
    }

    return (
        <section className="p-4 flex-shrink-0">
            <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Visualization Controls</h3>
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
        </section>
    );
};

export default VisualizationControlPanel;