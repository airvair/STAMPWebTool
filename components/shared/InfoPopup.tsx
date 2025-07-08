import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import React, { useState, ReactNode } from 'react';
import Button from './Button';
import Modal from './Modal';

interface InfoPopupProps {
  title: string;
  content: ReactNode;
  containerClassName?: string;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ title, content, containerClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const StyledContent: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className="space-y-4 text-slate-300">
      <style>{`
                .info-content-dark p {
                    line-height: 1.6;
                    color: #d1d5db; /* gray-300 */
                }
                .info-content-dark h4 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: #f1f5f9; /* slate-100 */
                }
                .info-content-dark ul {
                    list-style-type: disc;
                    padding-left: 1.25rem;
                    space-y: 0.5rem;
                }
                 .info-content-dark li {
                    color: #d1d5db; /* gray-300 */
                }
                .info-content-dark blockquote {
                    border-left: 4px solid #475569; /* slate-600 */
                    padding-left: 1rem;
                    margin: 1rem 0;
                    font-style: italic;
                    color: #cbd5e1; /* slate-300 */
                }
            `}</style>
      <div className="info-content-dark">{children}</div>
    </div>
  );

  const modalFooter = (
    <div className="text-right">
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </div>
  );

  return (
    <div className={`inline-block align-middle ${containerClassName}`}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full bg-slate-800 px-1.5 py-1.5 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-black"
        onClick={() => setIsOpen(true)}
        aria-label={`More information about ${title}`}
      >
        <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        size="2xl"
        footer={modalFooter}
      >
        <StyledContent>{content}</StyledContent>
      </Modal>
    </div>
  );
};

export default InfoPopup;
