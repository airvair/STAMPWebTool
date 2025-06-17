// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/partials/FeedbackPathsBuilder.tsx
import React, { useState } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { Controller, FeedbackPath, SystemComponent } from '../../../types';
import { MISSING_FEEDBACK_COLOR } from '../../../constants';
import Select from '../../shared/Select';
import Button from '../../shared/Button';
import Textarea from '../../shared/Textarea';
import Checkbox from '../../shared/Checkbox';

const PlaceholderPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const PlaceholderTrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const FeedbackPathsBuilder: React.FC = () => {
    const {
        controllers,
        systemComponents,
        feedbackPaths, addFeedbackPath, updateFeedbackPath, deleteFeedbackPath,
    } = useAnalysis();

    const [fpSourceId, setFpSourceId] = useState('');
    const [fpTargetCtrlId, setFpTargetCtrlId] = useState('');
    const [fpFeedback, setFpFeedback] = useState('');
    const [fpIsMissing, setFpIsMissing] = useState(false);
    const [fpIndirect, setFpIndirect] = useState(false);
    const [editingFpId, setEditingFpId] = useState<string | null>(null);

    const controllerOptions = controllers.map(c => ({ value: c.id, label: c.name }));
    const componentOptions = systemComponents.map(sc => ({ value: sc.id, label: sc.name }));
    const pathTargetOptions = [...controllerOptions, ...componentOptions];

    const getItemName = (id: string) => {
        const ctrl = controllers.find(c => c.id === id);
        if (ctrl) return `${ctrl.name} (Controller)`;
        const comp = systemComponents.find(sc => sc.id === id);
        if (comp) return `${comp.name} (Component)`;
        return 'Unknown';
    };

    const handleSaveFeedbackPath = () => {
        if (!fpSourceId || !fpTargetCtrlId || !fpFeedback) return;
        if (editingFpId) {
            updateFeedbackPath(editingFpId, { sourceId: fpSourceId, targetControllerId: fpTargetCtrlId, feedback: fpFeedback, isMissing: fpIsMissing, indirect: fpIndirect });
        } else {
            addFeedbackPath({ sourceId: fpSourceId, targetControllerId: fpTargetCtrlId, feedback: fpFeedback, isMissing: fpIsMissing, indirect: fpIndirect });
        }
        setFpSourceId(''); setFpTargetCtrlId(''); setFpFeedback(''); setFpIsMissing(false); setFpIndirect(false); setEditingFpId(null);
    };

    const editFeedbackPath = (fp: FeedbackPath) => {
        setEditingFpId(fp.id);
        setFpSourceId(fp.sourceId);
        setFpTargetCtrlId(fp.targetControllerId);
        setFpFeedback(fp.feedback);
        setFpIsMissing(fp.isMissing);
        setFpIndirect(!!fp.indirect);
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">4. Feedback Paths (Source → Controller)</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-4">
                <Select label="Source (Component or Controller)" value={fpSourceId} onChange={e => setFpSourceId(e.target.value)} options={[{value: '', label: 'Select Source'}, ...pathTargetOptions]} placeholder="Select Source" />
                <Select label="Target Controller" value={fpTargetCtrlId} onChange={e => setFpTargetCtrlId(e.target.value)} options={[{value: '', label: 'Select Target Controller'}, ...controllerOptions]} placeholder="Select Target Controller" />
                <Textarea label="Feedback/Sensors (comma-separated list)" value={fpFeedback} onChange={e => setFpFeedback(e.target.value)} placeholder="e.g., CURRENT_SPEED, TEMP_READING, STATUS_FLAG" />
                <Checkbox label="Is this feedback path missing or inadequate?" checked={fpIsMissing} onChange={e => setFpIsMissing(e.target.checked)} />
                <Checkbox label="Is this feedback indirect via another controller?" checked={fpIndirect} onChange={e => setFpIndirect(e.target.checked)} />
                <Button onClick={handleSaveFeedbackPath} leftIcon={<PlaceholderPlusIcon />}>
                    {editingFpId ? 'Update Feedback Path' : 'Add Feedback Path'}
                </Button>
            </div>
            <ul className="space-y-2">
                {feedbackPaths.map(fp => (
                    <li key={fp.id} className={`flex justify-between items-center p-3 border rounded-md bg-white shadow-sm ${fp.isMissing ? `${MISSING_FEEDBACK_COLOR} border-dashed` : 'border-slate-300'}`}>
                        <div>
                            <p><span className="font-semibold">{getItemName(fp.sourceId)}</span> → <span className="font-semibold">{getItemName(fp.targetControllerId)}</span> {fp.isMissing && <span className="text-sm font-bold">(MISSING/INADEQUATE)</span>}</p>
                            <p className="text-sm">Feedback: {fp.feedback}</p>
                            {fp.indirect && <p className="text-xs text-slate-500">Indirect feedback</p>}
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                            <Button onClick={() => editFeedbackPath(fp)} size="sm" variant="ghost" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                            <Button onClick={() => deleteFeedbackPath(fp.id)} size="sm" variant="ghost" className="text-red-600 hover:bg-red-100" aria-label="Delete"><PlaceholderTrashIcon /></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default FeedbackPathsBuilder;