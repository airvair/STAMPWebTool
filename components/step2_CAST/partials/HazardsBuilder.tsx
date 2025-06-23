import React, { ChangeEvent } from 'react';
import { Hazard, Loss, AnalysisType } from '../../../types';
import { hazardInfoContent, subHazardInfoContent } from './CastInfo';
import Input from '../../shared/Input';
import Checkbox from '../../shared/Checkbox';
import Button from '../../shared/Button';
import InfoPopup from '../../shared/InfoPopup';
import Textarea from '../../shared/Textarea';

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

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
                                                           parentHazardForSubHazard,
                                                           subHazardDescription,
                                                           coveredLossCount,
                                                           handleHazardInputChange,
                                                           handleHazardLossLinkChange,
                                                           handleSaveHazard,
                                                           resetHazardForm,
                                                           editHazard,
                                                           deleteHazard,
                                                           setParentHazardForSubHazard,
                                                           setSubHazardDescription,
                                                           handleAddSubHazard,
                                                       }) => {
    return (
        <div>
            <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                    {analysisType === AnalysisType.CAST ? "4. Identify Hazards Leading to Losses" : "3. Identify System-Level Hazards"}
                    {losses.length > 0 && (
                        <span className="ml-2 text-xs bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-full px-2 py-0.5 align-middle">
              {coveredLossCount} / {losses.length} losses covered
            </span>
                    )}
                </h3>
                <InfoPopup title="About System-Level Hazards" content={hazardInfoContent} />
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300 mb-4 space-y-2">
                <p>You will now be led through the process to write out your hazards.</p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-md border border-slate-300 dark:border-slate-700 mb-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Here is what a hazard looks like:</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-mono p-2 bg-white dark:bg-slate-900/50 rounded">
                    <span style={{ color: 'red' }}>H-1:</span> <span style={{ color: 'green' }}>[System Component]</span> <span style={{ color: 'blue' }}>[Environmental Condition and System State]</span> <span style={{ color: 'purple' }}>[L-1, L-2..]</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Example: H-1: Aircraft violates minimum separation standards inflight [L-1, L-2]</p>
            </div>

            <div className="p-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Tips to prevent common mistakes when identifying hazards:</h4>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Hazards should not refer to individual components of the system.</li>
                    <li>All hazards should refer to the overall system and system state.</li>
                    <li>Hazards should refer to factors that can be controlled or managed by the system designers and operators.</li>
                    <li>All hazards should describe system-level conditions to be prevented.</li>
                    <li>The number of hazards should be relatively small, usually no more than 7 to 10.</li>
                    <li>Hazards should not include ambiguous or recursive words like “unsafe”, “unintended”, “accidental”, etc.</li>
                </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 mb-6">
                <Input
                    label="Enter the hazard description"
                    id="hazard-description"
                    value={currentHazardText}
                    onChange={handleHazardInputChange}
                    placeholder="e.g., Aircraft violates minimum separation standards inflight"
                />
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link to Losses (select at least one):
                        {linkedLossIds.length > 0 && (
                            <span className="text-green-600 ml-1">✓</span>
                        )}
                    </label>
                    {losses.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No losses defined yet. Please add losses first.</p>}
                    {losses.map(loss => (<Checkbox key={loss.id} id={`hazard-link-${loss.id}-${analysisType}`} label={`${loss.code}: ${loss.title}`} checked={linkedLossIds.includes(loss.id)} onChange={e => handleHazardLossLinkChange(loss.id, e.target.checked)} />))}
                    {linkedLossIds.length === 0 && <p className="text-xs text-red-500 mt-1">A hazard must be linked to at least one loss.</p>}
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handleSaveHazard} leftIcon={<PlaceholderPlusIcon />}>{editingHazardId ? 'Update Hazard' : 'Add Hazard'}</Button>
                    {editingHazardId && <Button onClick={resetHazardForm} variant="secondary">Cancel Edit</Button>}
                </div>
                {hazardError && <p className="text-red-500 text-sm mt-1">{hazardError}</p>}
            </div>

            {hazards.filter(h => !h.parentHazardId).length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-200 mb-2">Defined Hazards:</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">After each hazard is completed, you can create an additional hazard using the form above.</p>
                    <ul className="space-y-2">
                        {hazards.filter(h => !h.parentHazardId).map(h => (
                            <li key={h.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                                <div className="font-semibold text-slate-800 dark:text-slate-100">{h.code}: {h.title} [{h.linkedLossIds.map(id => losses.find(l => l.id === id)?.code || 'N/A').join(', ')}]</div>
                                <div className="mt-2 flex items-center space-x-2">
                                    <Button onClick={() => editHazard(h)} size="sm" variant="ghost">Edit</Button>
                                    <Button onClick={() => deleteHazard(h.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50">Delete</Button>
                                    <Button onClick={() => setParentHazardForSubHazard(h.id)} size="sm" variant="ghost" className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">Add Sub-Hazard</Button>
                                    <InfoPopup title="Refining System-Level Hazards" content={subHazardInfoContent} />
                                </div>
                                {hazards.filter(subH => subH.parentHazardId === h.id).map(subH => (
                                    <div key={subH.id} className="ml-4 mt-2 p-2 border-l-2 border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/30 rounded-r-md">
                                        <p className="font-medium text-sky-700 dark:text-sky-300">{subH.code}: {subH.title} (Sub-hazard of {h.code})</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Linked Losses: {subH.linkedLossIds.map(id => losses.find(l => l.id === id)?.code || 'N/A').join(', ')}</p>
                                        <div className="mt-1 space-x-1"> <Button onClick={() => editHazard(subH)} size="sm" variant="ghost">Edit</Button> <Button onClick={() => deleteHazard(subH.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50">Delete</Button> </div>
                                    </div>
                                ))}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {parentHazardForSubHazard && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                    <h4 className="text-md font-semibold text-amber-700 dark:text-amber-300 mb-2">Define Sub-Hazard for {hazards.find(h => h.id === parentHazardForSubHazard)?.code}:</h4>
                    <Textarea
                        label="Sub-Hazard Description (Specific condition or refinement of the parent hazard):"
                        value={subHazardDescription}
                        onChange={e => setSubHazardDescription(e.target.value)}
                        placeholder="e.g., Thrust not sufficient during takeoff roll, Angle of attack too high during landing flare"
                        rows={2}
                    />
                    <div className="flex space-x-2 mt-2">
                        <Button onClick={handleAddSubHazard} leftIcon={<PlaceholderPlusIcon />} className="bg-amber-500 hover:bg-amber-600 text-white">Add Sub-Hazard</Button>
                        <Button onClick={() => { setParentHazardForSubHazard(null); setSubHazardDescription(''); }} variant="secondary">Cancel</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HazardsBuilder;