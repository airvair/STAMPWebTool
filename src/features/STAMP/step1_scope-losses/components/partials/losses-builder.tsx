import React from 'react';
import { Button } from '@/components/shared';
import { Checkbox, Input } from '@/components/shared';
import { Loss, AnalysisType } from '@/types/types';
import { STANDARD_LOSSES } from '@/utils/constants';
import CastStepLayout from './cast-step-layout';

const PlaceholderPlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const PlaceholderTrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

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
  const title = 'Identify the Losses';
  const description =
    'Every accident results in losses. What went wrong here? Was it a loss of life, property, or something else? This defines the impact of the event.';

  return (
    <CastStepLayout title={title} description={description}>
      {getUnlinkedLosses().length > 0 && losses.length > 0 && (
        <div className="mb-4 rounded-md border border-orange-300 bg-orange-100 p-2 text-xs text-orange-600 dark:border-orange-600/50 dark:bg-orange-900/30 dark:text-orange-400">
          Warning (BR-2-HLink): The following losses are not yet linked to any hazard:{' '}
          {getUnlinkedLosses()
            .map(l => `${l.code}: ${l.title}`)
            .join(', ')}
          .
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {STANDARD_LOSSES.map(stdLoss => (
            <div
              key={stdLoss.id}
              className={`rounded-lg border-2 p-4 transition-colors ${selectedLossIdsState.includes(stdLoss.id) ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600'}`}
            >
              <Checkbox
                id={`loss-${stdLoss.id}-${analysisType}`}
                label={stdLoss.title}
                checked={selectedLossIdsState.includes(stdLoss.id)}
                onChange={e => handleLossSelectionChange(stdLoss.id, e.target.checked)}
                containerClassName="!mb-0"
              />
              <p className="ml-7 text-xs text-slate-500 dark:text-slate-400">
                {stdLoss.description}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
          <h4 className="text-md mb-2 font-semibold text-slate-600 dark:text-slate-300">
            Custom Losses:
          </h4>
          {losses
            .filter(l => !l.isStandard)
            .map(loss => (
              <div
                key={loss.id}
                className="mb-2 flex items-center justify-between rounded-md border border-slate-200 bg-white p-2 pl-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {loss.code}: {loss.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{loss.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteLoss(loss.id)}
                  className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  <PlaceholderTrashIcon />
                </Button>
              </div>
            ))}
          <div className="mt-4 flex items-end space-x-2">
            <Input
              label="Custom Loss Title"
              id={`otherLossTitle-${analysisType}`}
              value={otherLossTitle}
              onChange={e => setOtherLossTitle(e.target.value)}
              placeholder="e.g., Loss of Public Confidence"
              containerClassName="flex-grow !mb-0"
            />
            <Input
              label="Description"
              id={`otherLossDesc-${analysisType}`}
              value={otherLossDesc}
              onChange={e => setOtherLossDesc(e.target.value)}
              placeholder="Brief description"
              containerClassName="flex-grow !mb-0"
            />
            <Button
              onClick={handleAddOtherLoss}
              leftIcon={<PlaceholderPlusIcon />}
              className="h-10"
            >
              Add
            </Button>
          </div>
        </div>
        {losses.length === 0 && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600 dark:border-red-600/50 dark:bg-red-900/30 dark:text-red-400">
            Please select or add at least one loss to continue.
          </p>
        )}
      </div>
    </CastStepLayout>
  );
};

export default LossesBuilder;
