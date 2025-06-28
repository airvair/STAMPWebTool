import React from 'react';
import { NodeProps } from 'reactflow';
import { COMMANDER_BORDER_COLOR } from '@/constants';

interface TeamMemberNodeData {
    label: string;
    role?: string;
}

/**
 * TeamMemberNode is a specialized node for displaying individual members within a team container.
 * It does not have handles, as interactions (edges) should connect to the parent team container.
 */
export const TeamMemberNode: React.FC<NodeProps<TeamMemberNodeData>> = ({ data, selected }) => {
    // Check if this member is a commander based on their role/rank for special styling.
    // 'CM-1' is used as the identifier for the highest authority/commander.
    const isCommander = data.role === 'CM-1';

    return (
        <div
            style={{
                backgroundColor: 'rgba(51, 65, 85, 0.7)', // slate-700 with transparency
                color: '#e2e8f0', // slate-200
                padding: '8px 12px',
                borderRadius: '6px',
                width: '100%',
                height: '100%',
                border: `1.5px solid ${isCommander ? COMMANDER_BORDER_COLOR : (selected ? '#0ea5e9' : 'rgba(100, 116, 139, 0.8)')}`, // sky-500 for selected, slate-500 for default
                textAlign: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                transition: 'border-color 0.2s ease-in-out'
            }}
        >
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{data.label}</div>
            {data.role && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{data.role}</div>}
        </div>
    );
};
