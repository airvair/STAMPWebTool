import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { SystemComponent, ComponentType } from '../../../types';
import Input from '../../shared/Input';
import Select from '../../shared/Select';
import Button from '../../shared/Button';

const PlaceholderPlusIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const PlaceholderTrashIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
        />
    </svg>
);

const SystemComponentsBuilder: React.FC = () => {
    const { hazards, systemComponents, addSystemComponent, updateSystemComponent, deleteSystemComponent } = useAnalysis();

    const [componentName, setComponentName] = useState('');
    const [componentType, setComponentType] = useState<ComponentType>(ComponentType.Physical);
    const [editingComponentId, setEditingComponentId] = useState<string | null>(null);

    const componentTypeOptions = Object.values(ComponentType).map(ct => ({ value: ct, label: ct }));

    // Auto-import system components from hazards on first render
    useEffect(() => {
        if (hazards.length === 0) return;
        hazards.forEach(h => {
            const base = h.systemComponent.trim();
            if (!base) return;
            const existing = systemComponents.filter(sc => sc.name.startsWith(base));
            const existsExact = systemComponents.some(sc => sc.name === base);
            if (!existsExact) {
                const name = existing.length > 0 ? `${base} ${existing.length + 1}` : base;
                addSystemComponent({ name, type: ComponentType.Physical });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleSaveComponent = () => {
        if (!componentName) return;
        if (editingComponentId) {
            updateSystemComponent(editingComponentId, { name: componentName, type: componentType });
        } else {
            const existing = systemComponents.filter(sc => sc.name.startsWith(componentName));
            const existsExact = systemComponents.some(sc => sc.name === componentName);
            const name = existsExact ? `${componentName} ${existing.length + 1}` : componentName;
            addSystemComponent({ name, type: componentType });
        }
        setComponentName(''); setComponentType(ComponentType.Physical); setEditingComponentId(null);
    };

    const editComponent = (comp: SystemComponent) => {
        setEditingComponentId(comp.id);
        setComponentName(comp.name);
        setComponentType(comp.type);
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">1. System Components (Physical/Process)</h3>
            <div className="text-sm text-slate-600 space-y-2 mb-4">
                <p>
                    Start at the most basic component in the system you intend to control. In most systems this is the physical system, such as a vehicle, an aircraft, a satellite or similar. If you are analyzing just a component that that is the most basic, which could be something like the brakes, a steering wheel, the engine, or perhaps even a door. It can also be a process if you are analyzing an organization on how it manages a department or even a person, such as the case in health care where the patient might be the most basic process. Regardless, it is the lowest level you are analyzing.
                </p>
                <p className="font-semibold">
                    Think about your system. What is the most basic component in your system?
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                <Input label="Component Name" value={componentName} onChange={e => setComponentName(e.target.value)} placeholder="e.g., Engine, Database" />
                <Select label="Component Type" value={componentType} onChange={e => setComponentType(e.target.value as ComponentType)} options={componentTypeOptions} />
                <Button onClick={handleSaveComponent} leftIcon={<PlaceholderPlusIcon />} className="self-end mb-4 h-10">
                    {editingComponentId ? 'Update Component' : 'Add Component'}
                </Button>
            </div>
            <ul className="space-y-2">
                {systemComponents.map(comp => (
                    <li key={comp.id} className="p-3 border border-slate-300 rounded-md bg-white shadow-sm flex justify-between items-center">
                        <div><span className="font-medium">{comp.name}</span> <span className="text-sm text-slate-500">({comp.type})</span></div>
                        <div className="space-x-2">
                            <Button
                                onClick={() => editComponent(comp)}
                                size="sm"
                                variant="ghost"
                                className="p-1"
                                aria-label="Edit"
                            >
                                Edit
                            </Button>
                            <Button
                                onClick={() => deleteSystemComponent(comp.id)}
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 p-1"
                                aria-label="Delete"
                            >
                                <PlaceholderTrashIcon />
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default SystemComponentsBuilder;