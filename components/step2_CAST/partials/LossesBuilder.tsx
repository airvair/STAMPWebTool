import React from 'react';
import { Loss, AnalysisType } from '../../../types';
import { STANDARD_LOSSES } from '../../../constants';
import Input from '../../shared/Input';
import Button from '../../shared/Button';
import Checkbox from '../../shared/Checkbox';

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

interface LossesBuilderProps {
    analysisType: AnalysisType;
    losses: Loss[];
    selectedLossIdsState: string[];
    otherLossTitle: string;
    otherLossDesc: string;
    getUnlinkedLosses: () => Loss[];
    handleLossSelectionChange: (lossId: string, isSelected: boolean) => void;
    setOtherLossTitle: (title: string) => void;
    setOtherLossDesc: (desc: string) => void;
    handleAddOtherLoss: () => void;
    deleteLoss: (id: string) => void;
}

const LossesBuilder: React.FC<LossesBuilderProps> = ({
                                                         analysisType,
                                                         losses,
                                                         selectedLossIdsState,
                                                         otherLossTitle,
                                                         otherLossDesc,
                                                         getUnlinkedLosses,
                                                         handleLossSelectionChange,
                                                         setOtherLossTitle,
                                                         setOtherLossDesc,
                                                         handleAddOtherLoss,
                                                         deleteLoss,
                                                     }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                {analysisType === AnalysisType.CAST ? "3. Identify Losses that Occurred" : "2. Identify System-Level Losses to Prevent"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Select standard losses and/or define custom ones. At least one loss must be defined and linked to a hazard.</p>
            {getUnlinkedLosses().length > 0 && losses.length > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mb-3 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600/50 rounded-md">
                    Warning (BR-2-HLink): The following losses are not yet linked to any hazard: {getUnlinkedLosses().map(l => `${l.code}: ${l.title}`).join(', ')}. Please link them in the Hazards section.
                </p>
            )}
            <div className="space-y-3">
                {STANDARD_LOSSES.map(stdLoss => (
                    <Checkbox key={stdLoss.id} id={`loss-${stdLoss.id}-${analysisType}`} label={`${stdLoss.title} - ${stdLoss.description}`} checked={selectedLossIdsState.includes(stdLoss.id)} onChange={(e) => handleLossSelectionChange(stdLoss.id, e.target.checked)} />
                ))}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-2">Other Losses:</h4>
                    {losses.filter(l => !l.isStandard).map(loss => (
                        <div key={loss.id} className="flex items-center justify-between p-2 border border-slate-200 dark:border-slate-700 rounded-md mb-2 bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-200">{loss.code}: {loss.title}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{loss.description}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteLoss(loss.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50"><PlaceholderTrashIcon /></Button>
                        </div>
                    ))}
                    <div className="flex items-end space-x-2">
                        <Input label="Custom Loss Title" id={`otherLossTitle-${analysisType}`} value={otherLossTitle} onChange={(e) => setOtherLossTitle(e.target.value)} placeholder="e.g., Loss of Public Confidence" containerClassName="flex-grow" />
                        <Input label="Custom Loss Description" id={`otherLossDesc-${analysisType}`} value={otherLossDesc} onChange={(e) => setOtherLossDesc(e.target.value)} placeholder="Brief description" containerClassName="flex-grow" />
                        <Button onClick={handleAddOtherLoss} leftIcon={<PlaceholderPlusIcon />} className="mb-4">Add Custom Loss</Button>
                    </div>
                    {losses.length === 0 && (<p className="text-xs text-red-600">Please add at least one loss.</p>)}
                </div>
                {losses.length > 0 && (<div className="mt-4">
                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-200 mb-1">Selected/Defined Losses:</h4>
                    <ul className="list-disc list-inside ml-4 text-sm text-slate-300">
                        {losses.map(l => <li key={l.id}>{l.code}: {l.title}</li>)}
                    </ul>
                </div>)}
            </div>
        </div>
    );
};

export default LossesBuilder;