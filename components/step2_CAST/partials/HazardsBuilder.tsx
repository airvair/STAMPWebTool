// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step2_CAST/partials/HazardsBuilder.tsx
import React, { ChangeEvent } from 'react';
import { Hazard, Loss, AnalysisType } from '../../../types';
import { hazardInfoContent } from './CastInfo';
import Checkbox from '../../shared/Checkbox';
import Button from '../../shared/Button';
import InfoPopup from '../../shared/InfoPopup';
import Textarea from '../../shared/Textarea';
import CastStepLayout from './CastStepLayout';

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;


interface HazardsBuilderProps {
    analysisType: AnalysisType;
    hazards: Hazard[];
    losses: Loss[];
    currentHazardText: string;
    hazardError: string;
    editingHazardId: string | null;
    linkedLossIds: string[];
    parentHazardForSubHazard: string | null;
    subHazardDescription: string;
    coveredLossCount: number;
    handleHazardInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleHazardLossLinkChange: (lossId: string, checked: boolean) => void;
    handleSaveHazard: () => void;
    resetHazardForm: () => void;
    editHazard: (hazard: Hazard) => void;
    deleteHazard: (id: string) => void;
    setParentHazardForSubHazard: (id: string | null) => void;
    setSubHazardDescription: (description: string) => void;
    handleAddSubHazard: () => void;
}

const HazardsBuilder: React.FC<HazardsBuilderProps> = ({
                                                           analysisType,
                                                           hazards,
                                                           losses,
                                                           currentHazardText,
                                                           hazardError,
                                                           editingHazardId,
                                                           linkedLossIds,
                                                           coveredLossCount,
                                                           handleHazardInputChange,
                                                           handleHazardLossLinkChange,
                                                           handleSaveHazard,
                                                           resetHazardForm,
                                                           editHazard,
                                                           deleteHazard,
                                                       }) => {
    const title = "Identify Hazards";
    const description = (
        <>
            A Hazard is an unsafe situation that can lead to a Loss.
            <br />
            Let's define the specific unsafe situations that led to the losses you identified.
        </>
    );

    return (
        <CastStepLayout title={title} description={description}>
            <div className="flex items-center space-x-2 mb-4 justify-center">
                <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200">
                    What is a Hazard?
                </h4>
                <InfoPopup title="About System-Level Hazards" content={hazardInfoContent} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700/80 mb-6 shadow-inner">
                <Textarea
                    label="Describe the Hazard"
                    id="hazard-description"
                    value={currentHazardText}
                    onChange={handleHazardInputChange}
                    placeholder="Example: Aircraft violates minimum separation standards in flight"
                    rows={2}
                    containerClassName="!mb-2"
                />
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Which loss(es) can this hazard lead to?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {losses.map(loss => (<Checkbox key={loss.id} id={`hazard-link-${loss.id}-${analysisType}`} label={`${loss.code}: ${loss.title}`} checked={linkedLossIds.includes(loss.id)} onChange={e => handleHazardLossLinkChange(loss.id, e.target.checked)} />))}
                    </div>
                    {linkedLossIds.length === 0 && <p className="text-xs text-red-500 mt-2">A hazard must be linked to at least one loss.</p>}
                </div>
                <div className="flex space-x-2 mt-4">
                    <Button onClick={handleSaveHazard} leftIcon={<PlaceholderPlusIcon />}>{editingHazardId ? 'Update Hazard' : 'Add Hazard'}</Button>
                    {editingHazardId && <Button onClick={resetHazardForm} variant="secondary">Cancel Edit</Button>}
                </div>
                {hazardError && <p className="text-red-500 text-sm mt-2">{hazardError}</p>}
            </div>

            <div>
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2 text-center">Defined Hazards</h4>
                {hazards.length === 0 && (
                    <p className="text-center text-sm text-slate-500">No hazards defined yet.</p>
                )}
                {losses.length > 0 && (
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {coveredLossCount} of {losses.length} losses are covered by a hazard.
                    </div>
                )}
                <ul className="space-y-3">
                    {hazards.filter(h => !h.parentHazardId).map(h => (
                        <li key={h.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{h.code}: {h.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Leads to: [{h.linkedLossIds.map(id => losses.find(l => l.id === id)?.code || 'N/A').join(', ')}]</p>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                    <Button onClick={() => editHazard(h)} size="sm" variant="ghost">Edit</Button>
                                    <Button onClick={() => deleteHazard(h.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700"><PlaceholderTrashIcon /></Button>
                                </div>
                            </div>

                            {/* Sub-hazard logic can be added here if needed */}
                        </li>
                    ))}
                </ul>
            </div>
        </CastStepLayout>
    );
};

export default HazardsBuilder;