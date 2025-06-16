import React from 'react';
import SystemComponentsBuilder from './partials/SystemComponentsBuilder';
import ControllersBuilder from './partials/ControllersBuilder';
import ControlPathsBuilder from './partials/ControlPathsBuilder';
import FeedbackPathsBuilder from './partials/FeedbackPathsBuilder';
import CommunicationLinksBuilder from './partials/CommunicationLinksBuilder';
import ControlStructureVisualization from './partials/ControlStructureVisualization';

const ControlStructureBuilder: React.FC = () => {
  return (
      <div className="space-y-10">
        <div className="text-sm text-slate-600 space-y-2">
          <p>
            The goal of this analysis is to control or constrain the behavior of the system to prevent an accident or any unwanted behavior. To model this you will be creating a hierarchical control structure. This is not a schematic or organizational chart. Instead, the items on this structure are either something that is controlling something else (a controller), which can be software, human or organization, or a controlled process/item. This tool will guide you through this process.
          </p>
        </div>

        <SystemComponentsBuilder />

        <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-800 rounded-r-lg">
          <p className="font-semibold">Next Step: Controllers</p>
          <p className="text-sm mt-1">
            Before adding controllers, please take a moment to ensure all the basic physical and process components of your system have been defined above. A complete foundation of controlled items will make defining the controllers and their relationships more straightforward and accurate. You can return later if you need to add more components.
          </p>
        </div>

        <ControllersBuilder />
        <ControlPathsBuilder />
        <FeedbackPathsBuilder />
        <CommunicationLinksBuilder />
        <ControlStructureVisualization />

      </div>
  );
};

export default ControlStructureBuilder;