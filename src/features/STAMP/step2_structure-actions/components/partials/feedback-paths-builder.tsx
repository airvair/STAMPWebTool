import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { Button } from '@/components/shared';
import { Checkbox } from '@/components/shared';
import { Select, Textarea } from '@/components/shared';
import { useAnalysis } from '@/hooks/useAnalysis';
import { FeedbackPath } from '@/types/types';

const FeedbackPathsBuilder: React.FC = () => {
  const {
    controllers,
    systemComponents,
    feedbackPaths,
    addFeedbackPath,
    updateFeedbackPath,
    deleteFeedbackPath,
  } = useAnalysis();

  const [fpSourceId, setFpSourceId] = useState('');
  const [fpTargetCtrlId, setFpTargetCtrlId] = useState('');
  const [fpFeedback, setFpFeedback] = useState('');
  const [fpIsMissing, setFpIsMissing] = useState(false);
  const [editingFpId, setEditingFpId] = useState<string | null>(null);

  const controllerOptions = (controllers || []).map(c => ({ value: c.id, label: c.name }));
  const componentOptions = (systemComponents || []).map(sc => ({ value: sc.id, label: sc.name }));
  const pathSourceOptions = [...controllerOptions, ...componentOptions];

  const getItemName = (id: string) => {
    const ctrl = (controllers || []).find(c => c.id === id);
    if (ctrl) return `${ctrl.name} (Controller)`;
    const comp = (systemComponents || []).find(sc => sc.id === id);
    if (comp) return `${comp.name} (Component)`;
    return 'Unknown';
  };

  const resetForm = () => {
    setFpSourceId('');
    setFpTargetCtrlId('');
    setFpFeedback('');
    setFpIsMissing(false);
    setEditingFpId(null);
  };

  const handleSaveFeedbackPath = () => {
    if (!fpSourceId || !fpTargetCtrlId || !fpFeedback) return;

    if (fpSourceId === fpTargetCtrlId) {
      alert(
        'A controller cannot provide feedback to itself. Please select a different source or target.'
      );
      return;
    }

    const pathData = {
      sourceId: fpSourceId,
      targetControllerId: fpTargetCtrlId,
      feedback: fpFeedback,
      isMissing: fpIsMissing,
    };
    if (editingFpId) {
      updateFeedbackPath(editingFpId, pathData);
    } else {
      addFeedbackPath(pathData);
    }
    resetForm();
  };

  const editFeedbackPath = (fp: FeedbackPath) => {
    setEditingFpId(fp.id);
    setFpSourceId(fp.sourceId);
    setFpTargetCtrlId(fp.targetControllerId);
    setFpFeedback(fp.feedback);
    setFpIsMissing(fp.isMissing);
  };

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Feedback Paths</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          How does the controller know what&apos;s going on? Define the information paths that flow
          from a component back to its controller.
        </p>
      </div>
      <div className="w-full max-w-3xl space-y-4 rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
        <p className="text-md font-semibold text-slate-700 dark:text-slate-200">
          {editingFpId ? 'Editing Feedback Path' : 'Define a New Feedback Path'}
        </p>
        <Select
          label="1. Source (What provides the feedback?)"
          value={fpSourceId}
          onChange={e => setFpSourceId(e.target.value)}
          options={pathSourceOptions}
          placeholder="Select Source"
        />
        <Select
          label="2. Target (Who receives the feedback?)"
          value={fpTargetCtrlId}
          onChange={e => setFpTargetCtrlId(e.target.value)}
          options={controllerOptions}
          placeholder="Select Target Controller"
        />
        <Textarea
          label="3. Describe Feedback / Sensors"
          value={fpFeedback}
          onChange={e => setFpFeedback(e.target.value)}
          placeholder="e.g., CURRENT_SPEED, TEMP_READING, STATUS_FLAG"
          containerClassName="!mb-0"
        />
        <Checkbox
          label="Is this feedback path missing or inadequate?"
          checked={fpIsMissing}
          onChange={e => setFpIsMissing(e.target.checked)}
          containerClassName="!mb-0 pt-2"
        />
        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSaveFeedbackPath} leftIcon={<PlusIcon className="h-5 w-5" />}>
            {editingFpId ? 'Update Path' : 'Add Path'}
          </Button>
          {editingFpId && (
            <Button onClick={resetForm} variant="secondary">
              Cancel
            </Button>
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {(feedbackPaths || []).map(fp => (
          <li
            key={fp.id}
            className={`flex items-center justify-between rounded-md border bg-white p-3 shadow-sm dark:bg-slate-900 ${fp.isMissing ? 'border-dashed border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`}
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                <span className="font-semibold">{getItemName(fp.sourceId)}</span> →{' '}
                <span className="font-semibold">{getItemName(fp.targetControllerId)}</span>{' '}
                {fp.isMissing && <span className="text-sm font-bold text-red-500">(MISSING)</span>}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Feedback: {fp.feedback}</p>
            </div>
            <div className="ml-4 flex items-center space-x-1">
              <Button onClick={() => editFeedbackPath(fp)} size="sm" variant="ghost">
                Edit
              </Button>
              <Button
                onClick={() => deleteFeedbackPath(fp.id)}
                size="sm"
                variant="ghost"
                className="text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default FeedbackPathsBuilder;
