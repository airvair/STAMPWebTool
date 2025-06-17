// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/partials/VisualizationControlPanel.tsx
import React from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { ControllerType } from '../../../types';
import Select from '../../shared/Select';

const VisualizationControlPanel: React.FC = () => {
    const { controllers, activeContexts, setActiveContext } = useAnalysis();

    const teamControllersWithContexts = controllers.filter(c =>
        c.ctrlType === ControllerType.Team &&
        !c.teamDetails?.isSingleUnit &&
        c.teamDetails?.contexts && c.teamDetails.contexts.length > 0
    );

    if (teamControllersWithContexts.length === 0) {
        return null; // Don't render the panel if there are no teams with contexts to configure
    }

    return (
        <section className="mt-6">
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">Visualization Controls</h3>
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamControllersWithContexts.map(team => {
                    const options = team.teamDetails!.contexts.map(ctx => ({
                        value: ctx.id,
                        label: ctx.name,
                    }));

                    return (
                        <Select
                            key={team.id}
                            label={`Active Context for "${team.name}":`}
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