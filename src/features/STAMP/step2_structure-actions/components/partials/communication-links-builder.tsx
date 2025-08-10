import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { Button } from '@/components/shared';
import { Select, Textarea } from '@/components/shared';
import { useAnalysis } from '@/hooks/useAnalysis';
import { CommunicationPath, ControllerType } from '@/types/types';

const CommunicationLinksBuilder: React.FC = () => {
  const {
    controllers,
    communicationPaths,
    addCommunicationPath,
    updateCommunicationPath,
    deleteCommunicationPath,
  } = useAnalysis();

  const [commSourceId, setCommSourceId] = useState('');
  const [commTargetId, setCommTargetId] = useState('');
  const [commDescription, setCommDescription] = useState('');
  const [editingCommId, setEditingCommId] = useState<string | null>(null);

  const controllerOptions = (controllers || []).map(c => ({ value: c.id, label: c.name }));
  const selectedSourceController = (controllers || []).find(c => c.id === commSourceId);

  // For intra-team communication
  const isIntraTeam =
    commSourceId &&
    commSourceId === commTargetId &&
    selectedSourceController?.ctrlType === ControllerType.Team &&
    !selectedSourceController?.teamDetails?.isSingleUnit;
  const memberOptions =
    (selectedSourceController?.teamDetails?.members || []).map(m => ({
      value: m.id,
      label: m.name,
    })) || [];
  const [sourceMemberId, setSourceMemberId] = useState('');
  const [targetMemberId, setTargetMemberId] = useState('');

  const handleSaveCommunicationPath = () => {
    if (!commSourceId || !commTargetId || !commDescription) return;

    // Prevent non-team controllers from communicating with themselves
    if (commSourceId === commTargetId && !isIntraTeam) {
      alert(
        'A controller cannot communicate with itself. Please select a different target controller.'
      );
      return;
    }

    const pathData: Omit<CommunicationPath, 'id'> = {
      sourceControllerId: commSourceId,
      targetControllerId: commTargetId,
      description: commDescription,
    };

    if (isIntraTeam) {
      if (!sourceMemberId || !targetMemberId || sourceMemberId === targetMemberId) {
        alert('Please select two different members for intra-team communication.');
        return;
      }
      pathData.sourceMemberId = sourceMemberId;
      pathData.targetMemberId = targetMemberId;
    }

    if (editingCommId) {
      updateCommunicationPath(editingCommId, pathData);
    } else {
      addCommunicationPath(pathData);
    }
    resetForm();
  };

  const resetForm = () => {
    setCommSourceId('');
    setCommTargetId('');
    setCommDescription('');
    setEditingCommId(null);
    setSourceMemberId('');
    setTargetMemberId('');
  };

  const editCommunicationPath = (comm: CommunicationPath) => {
    setEditingCommId(comm.id);
    setCommSourceId(comm.sourceControllerId);
    setCommTargetId(comm.targetControllerId);
    setCommDescription(comm.description);
    setSourceMemberId(comm.sourceMemberId || '');
    setTargetMemberId(comm.targetMemberId || '');
  };

  const getItemName = (comm: CommunicationPath, type: 'source' | 'target'): string => {
    const id = type === 'source' ? comm.sourceControllerId : comm.targetControllerId;
    const memberId = type === 'source' ? comm.sourceMemberId : comm.targetMemberId;

    const controller = (controllers || []).find(c => c.id === id);
    if (!controller) return 'Unknown';

    if (memberId && controller.teamDetails) {
      const member = (controller.teamDetails.members || []).find(m => m.id === memberId);
      return member
        ? `${member.name} (in ${controller.name})`
        : `Unknown Member (in ${controller.name})`;
    }

    return `${controller.name} (Controller)`;
  };

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Communication Links
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sometimes controllers talk to each other. Define these peer-to-peer links for coordination
          and information sharing.
        </p>
      </div>
      <div className="w-full max-w-3xl space-y-4 rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
        <p className="text-md font-semibold text-slate-700 dark:text-slate-200">
          {editingCommId ? 'Editing Communication Link' : 'Define a New Link'}
        </p>
        <Select
          label="Controller One"
          value={commSourceId}
          onChange={e => {
            setCommSourceId(e.target.value);
          }}
          options={controllerOptions}
          placeholder="Select Controller"
        />
        <Select
          label="Controller Two"
          value={commTargetId}
          onChange={e => setCommTargetId(e.target.value)}
          options={controllerOptions}
          placeholder="Select Controller"
        />

        {isIntraTeam && (
          <div className="mt-4 space-y-4 border-t border-dashed border-slate-300 p-3 dark:border-neutral-700">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Define Intra-Team Communication:
            </h4>
            <Select
              label="Source Member"
              value={sourceMemberId}
              onChange={e => setSourceMemberId(e.target.value)}
              options={memberOptions}
              placeholder="Select Member"
            />
            <Select
              label="Target Member"
              value={targetMemberId}
              onChange={e => setTargetMemberId(e.target.value)}
              options={memberOptions}
              placeholder="Select Member"
            />
          </div>
        )}

        <Textarea
          label="Description of Communication / Coordination"
          value={commDescription}
          onChange={e => setCommDescription(e.target.value)}
          placeholder="e.g., Monitoring and callouts, Shared status reports"
          containerClassName="!mb-0"
        />
        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSaveCommunicationPath} leftIcon={<PlusIcon className="h-5 w-5" />}>
            {editingCommId ? 'Update Link' : 'Add Link'}
          </Button>
          {editingCommId && (
            <Button onClick={resetForm} variant="secondary">
              Cancel
            </Button>
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {(communicationPaths || []).map(comm => (
          <li
            key={comm.id}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                <span className="font-semibold">{getItemName(comm, 'source')}</span> ↔{' '}
                <span className="font-semibold">{getItemName(comm, 'target')}</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Via: {comm.description}</p>
            </div>
            <div className="ml-4 flex items-center space-x-1">
              <Button onClick={() => editCommunicationPath(comm)} size="sm" variant="ghost">
                Edit
              </Button>
              <Button
                onClick={() => deleteCommunicationPath(comm.id)}
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

export default CommunicationLinksBuilder;
