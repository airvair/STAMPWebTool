// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step3_ControlStructure/ControlStructureBuilder.tsx
import React, { useState } from 'react';
import SystemComponentsBuilder from './partials/SystemComponentsBuilder';
import ControllersBuilder from './partials/ControllersBuilder';
import ControlPathsBuilder from './partials/ControlPathsBuilder';
import FeedbackPathsBuilder from './partials/FeedbackPathsBuilder';
import CommunicationLinksBuilder from './partials/CommunicationLinksBuilder';
import ControlStructureVisualization from './partials/ControlStructureVisualization';
import VisualizationControlPanel from './partials/VisualizationControlPanel';

const buildSteps = [
    "Components",
    "Controllers",
    "Control Paths",
    "Feedback Paths",
    "Communication"
];

const ControlStructureBuilder: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);

    const renderStepContent = () => {
        switch (activeStep) {
            case 0: return <SystemComponentsBuilder />;
            case 1: return <ControllersBuilder />;
            case 2: return <ControlPathsBuilder />;
            case 3: return <FeedbackPathsBuilder />;
            case 4: return <CommunicationLinksBuilder />;
            default: return <SystemComponentsBuilder />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left Panel: Builder Steps */}
            <div className="flex flex-col">
                <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-400 text-sky-800 dark:text-sky-300 rounded-r-lg text-sm space-y-2">
                    <p>
                        Let's build the **Safety Control Structure**. Think of it as a ladder: we start with the process at the bottom and add layers of control on top. The diagram on the right will update as you work.
                    </p>
                </div>

                <div className="mt-6">
                    <nav aria-label="Progress">
                        <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                            {buildSteps.map((stepName, stepIdx) => (
                                <li key={stepName} className="md:flex-1">
                                    <button
                                        onClick={() => setActiveStep(stepIdx)}
                                        className="group flex w-full flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                                        style={{ borderColor: stepIdx === activeStep ? 'rgb(14 165 233)' : 'rgb(51 65 85)' }}
                                    >
                                        <span className={`text-sm font-medium transition-colors ${stepIdx === activeStep ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>{`Step ${stepIdx + 1}`}</span>
                                        <span className={`text-sm font-medium ${stepIdx === activeStep ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>{stepName}</span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                <div className="mt-8 flex-grow">
                    {renderStepContent()}
                </div>
            </div>

            {/* Right Panel: Live Visualization with Controls */}
            <div className="h-[85vh] sticky top-24 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                <VisualizationControlPanel />
                <div className="flex-grow w-full h-full border-t border-slate-200 dark:border-slate-800">
                    <ControlStructureVisualization />
                </div>
            </div>
        </div>
    );
};

export default ControlStructureBuilder;