import React, { useState, ReactNode } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';

interface InfoPopupProps {
    title: string;
    content: ReactNode;
    containerClassName?: string;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ title, content, containerClassName = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`inline-block ${containerClassName}`}>
            <button
                onClick={() => setIsOpen(true)}
                className="text-slate-400 hover:text-sky-600 transition-colors"
                aria-label={`More information about ${title}`}
            >
                <QuestionMarkCircleIcon className="w-6 h-6" />
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size="lg">
                <div className="prose prose-slate max-w-none text-sm max-h-[70vh] overflow-y-auto pr-2">
                    {content}
                </div>
                <div className="mt-6 text-right">
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};

export default InfoPopup;