import React from 'react';
import ControlStructureGraph from './ControlStructureGraph';

interface ControlStructureDiagramProps {
    showFailurePaths?: boolean;
}

/**
 * Unified control structure diagram component for both CAST and STPA methodologies.
 * Previously duplicated as CastControlStructureDiagram and StpaControlStructureDiagram,
 * but they were identical so this consolidates them into a single component.
 */
const ControlStructureDiagram: React.FC<ControlStructureDiagramProps> = ({ showFailurePaths = false }) => {
    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <ControlStructureGraph showFailurePaths={showFailurePaths} />
        </div>
    );
};

export default ControlStructureDiagram;