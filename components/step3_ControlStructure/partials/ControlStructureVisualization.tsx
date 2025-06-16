import React, { useRef } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { AnalysisType } from '../../../types';
import Button from '../../shared/Button';
import CastControlStructureDiagram from '../CastControlStructureDiagram';
import StpaControlStructureDiagram from '../StpaControlStructureDiagram';

const downloadSvg = (svg: SVGSVGElement | null) => {
    if (!svg) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
        source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'control-structure.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const ControlStructureVisualization: React.FC = () => {
    const { analysisSession } = useAnalysis();
    const svgRef = useRef<SVGSVGElement>(null); // Note: This ref is not currently connected to the SVG inside ReactFlow. A more advanced implementation would be needed to pass this ref down.
    const handleExportSvg = () => {
        // This is a placeholder for a more complex SVG export solution
        // as we cannot directly access the SVG element inside the ReactFlow component easily.
        const svgElement = document.querySelector('.react-flow__renderer svg');
        if (svgElement) {
            downloadSvg(svgElement as SVGSVGElement);
        } else {
            alert("Could not find SVG element to export.");
        }
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">6. Visualization</h3>
            <div className="mb-2">
                <Button size="sm" variant="secondary" onClick={handleExportSvg}>Download SVG</Button>
            </div>
            <div className="overflow-auto border p-2" style={{height: '70vh', minHeight: '500px'}}>
                {analysisSession?.analysisType === AnalysisType.CAST ? (
                    <CastControlStructureDiagram />
                ) : (
                    <StpaControlStructureDiagram />
                )}
            </div>
        </section>
    );
};

export default ControlStructureVisualization;