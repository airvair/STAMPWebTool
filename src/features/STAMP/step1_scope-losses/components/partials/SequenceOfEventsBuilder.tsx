import React, { useRef, useEffect } from 'react';
import Sortable from 'sortablejs';
import { EventDetail } from '@/types/types';
import Button from '@/components/shared/Button';
import AutoExpandingTextarea from '@/components/shared/AutoExpandingTextarea';
import CastStepLayout from "./CastStepLayout";


// SVG Icons for UI elements
const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const GripVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15" /></svg>


interface SequenceOfEventsBuilderProps {
    sequenceOfEvents: EventDetail[];
    newEventDesc: string;
    setNewEventDesc: (desc: string) => void;
    handleAddEvent: () => void;
    updateEventDetail: (id: string, updates: Partial<EventDetail>) => void;
    deleteEventDetail: (id: string) => void;
    // The `moveEvent` prop is replaced with `reorderEventDetails`
    reorderEventDetails: (events: EventDetail[]) => void;
}

const SequenceOfEventsBuilder: React.FC<SequenceOfEventsBuilderProps> = ({
                                                                             sequenceOfEvents,
                                                                             newEventDesc,
                                                                             setNewEventDesc,
                                                                             handleAddEvent,
                                                                             updateEventDetail,
                                                                             deleteEventDetail,
                                                                             reorderEventDetails,
                                                                         }) => {
    const title = "Build the Timeline";
    const description = (
        <>
            What happened, step by step? Think of yourself as a detective laying out the event sequence.
            <br />
            Describe actions in a neutral way, without judgment or blame. Drag and drop to reorder.
        </>
    );

    // Create a ref for the list container
    const sortableListRef = useRef<HTMLUListElement>(null);
    const sortedEvents = [...sequenceOfEvents].sort((a, b) => a.order - b.order);

    useEffect(() => {
        let sortableInstance: any = null;
        if (sortableListRef.current) {
            sortableInstance = Sortable.create(sortableListRef.current, {
                animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
                ghostClass: 'sortable-ghost', // Class name for the drop placeholder
                chosenClass: 'sortable-chosen', // Class name for the chosen item
                handle: '.drag-handle', // Restrict drag start to elements with the .drag-handle class
                onEnd: (evt) => {
                    const { oldIndex, newIndex } = evt;
                    if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
                        return;
                    }

                    // Create a mutable copy of the sorted events array
                    const newOrderedEvents = Array.from(sortedEvents);
                    // Remove the item from its old position
                    const [movedItem] = newOrderedEvents.splice(oldIndex, 1);
                    // Insert the item into its new position
                    newOrderedEvents.splice(newIndex, 0, movedItem);

                    // Call the context function to update the state with the new order
                    reorderEventDetails(newOrderedEvents);
                },
            });
        }

        // Cleanup function to destroy the sortable instance when the component unmounts
        return () => {
            if (sortableInstance) {
                sortableInstance.destroy();
            }
        };
    }, [sortedEvents, reorderEventDetails]); // Rerun effect if the events or the function changes

    return (
        <CastStepLayout title={title} description={description}>
            <div className="space-y-2 mb-4">
                {sortedEvents.length === 0 && (
                    <div className="text-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                        <p className="text-sm text-slate-500">No events added yet. Start by adding the first event below.</p>
                    </div>
                )}
                {/* Add the ref to the ul element */}
                <ul ref={sortableListRef} className="space-y-2">
                    {sortedEvents.map((event, index) => (
                        <li
                            key={event.id}
                            data-id={event.id}
                            className="flex items-start space-x-2 p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900/50"
                        >
                            {/* Drag handle */}
                            <div className="drag-handle text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 mt-1">
                                <GripVerticalIcon />
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 w-6 text-right font-mono mt-2">{index + 1}.</span>
                            <AutoExpandingTextarea
                                value={event.description}
                                onChange={(e) => updateEventDetail(event.id, { description: e.target.value })}
                                className="flex-grow !mb-0"
                                containerClassName="!mb-0 flex-grow"
                                placeholder="e.g., 00:42:17 – The aircraft descended through 10,000 ft..."
                                minRows={1}
                                maxRows={5}
                            />
                            {/* Replaced up/down arrows with delete button */}
                            <Button variant="ghost" size="sm" onClick={() => deleteEventDetail(event.id)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 p-1 mt-1">
                                <PlaceholderTrashIcon />
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex items-start space-x-2">
                <AutoExpandingTextarea
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="Enter new event description..."
                    className="flex-grow !mb-0"
                    containerClassName="!mb-0 flex-grow"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddEvent())}
                    minRows={1}
                    maxRows={5}
                />
                <Button onClick={handleAddEvent} leftIcon={<PlaceholderPlusIcon />} className="mt-1">Add Event</Button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                <strong>Tip:</strong> Avoid the word &apos;fail&apos; unless a mechanical part broke. (e.g., &quot;The pilot did not extend landing gear&quot; instead of &quot;The pilot failed to...&quot;).
            </p>
        </CastStepLayout>
    );
};

export default SequenceOfEventsBuilder;
