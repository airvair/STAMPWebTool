// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step2_CAST/partials/SequenceOfEventsBuilder.tsx
import React from 'react';
import { EventDetail } from '../../../types';
import Input from '../../shared/Input';
import Button from '../../shared/Button';
import CastStepLayout from "./CastStepLayout";

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const PlaceholderArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>;
const PlaceholderArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>;

interface SequenceOfEventsBuilderProps {
    sequenceOfEvents: EventDetail[];
    newEventDesc: string;
    setNewEventDesc: (desc: string) => void;
    handleAddEvent: () => void;
    updateEventDetail: (id: string, updates: Partial<EventDetail>) => void;
    deleteEventDetail: (id: string) => void;
    moveEvent: (index: number, direction: 'up' | 'down') => void;
}

const SequenceOfEventsBuilder: React.FC<SequenceOfEventsBuilderProps> = ({
                                                                             sequenceOfEvents,
                                                                             newEventDesc,
                                                                             setNewEventDesc,
                                                                             handleAddEvent,
                                                                             updateEventDetail,
                                                                             deleteEventDetail,
                                                                             moveEvent,
                                                                         }) => {
    const title = "Build the Timeline";
    const description = (
        <>
            What happened, step by step? Think of yourself as a detective laying out the event sequence.
            <br />
            Describe actions in a neutral way, without judgment or blame.
        </>
    );

    return (
        <CastStepLayout title={title} description={description}>
            <div className="space-y-2 mb-4">
                {sequenceOfEvents.length === 0 && (
                    <div className="text-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                        <p className="text-sm text-slate-500">No events added yet. Start by adding the first event below.</p>
                    </div>
                )}
                {sequenceOfEvents.sort((a, b) => a.order - b.order).map((event, index) => (
                    <div key={event.id} className="flex items-center space-x-2 p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900/50">
                        <span className="text-slate-500 dark:text-slate-400 w-6 text-right font-mono">{index + 1}.</span>
                        <Input
                            value={event.description}
                            onChange={(e) => updateEventDetail(event.id, { description: e.target.value })}
                            className="flex-grow !mb-0"
                            containerClassName="!mb-0 flex-grow"
                            placeholder="e.g., 00:42:17 – The aircraft descended through 10,000 ft..."
                        />
                        <div className="flex flex-col">
                            <Button variant="ghost" size="sm" onClick={() => moveEvent(index, 'up')} disabled={index === 0} className="p-1"><PlaceholderArrowUpIcon /></Button>
                            <Button variant="ghost" size="sm" onClick={() => moveEvent(index, 'down')} disabled={index === sequenceOfEvents.length - 1} className="p-1"><PlaceholderArrowDownIcon /></Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteEventDetail(event.id)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 p-1"><PlaceholderTrashIcon /></Button>
                    </div>
                ))}
            </div>
            <div className="flex items-center space-x-2">
                <Input value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} placeholder="Enter new event description..." className="flex-grow !mb-0" containerClassName="!mb-0 flex-grow" onKeyPress={(e) => e.key === 'Enter' && handleAddEvent()} />
                <Button onClick={handleAddEvent} leftIcon={<PlaceholderPlusIcon />}>Add Event</Button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                <strong>Tip:</strong> Avoid the word 'fail' unless a mechanical part broke. (e.g., "The pilot did not extend landing gear" instead of "The pilot failed to...").
            </p>
        </CastStepLayout>
    );
};

export default SequenceOfEventsBuilder;