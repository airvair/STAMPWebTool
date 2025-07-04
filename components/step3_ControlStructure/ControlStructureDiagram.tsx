import React from 'react';
import ControlStructureGraph from './ControlStructureGraph';

/**
 * Unified control structure diagram component for both CAST and STPA methodologies.
 * Previously duplicated as CastControlStructureDiagram and StpaControlStructureDiagram,
 * but they were identical so this consolidates them into a single component.
 */
const ControlStructureDiagram: React.FC = () => {
    return (
        <div style={{ height: '100%', width: '100%' }}>
            <ControlStructureGraph />
        </div>
    );
};

export default ControlStructureDiagram;