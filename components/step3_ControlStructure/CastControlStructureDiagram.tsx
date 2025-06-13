import React from 'react';
// We only need this one line to import the default export from our graph component file.
import ControlStructureGraph from './ControlStructureGraph';

const CastControlStructureDiagram: React.FC = () => {
    return (
        <div style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
            {/* We render the component we imported. */}
            <ControlStructureGraph />
        </div>
    );
};

export default CastControlStructureDiagram;