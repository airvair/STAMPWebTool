import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { SystemComponent, ComponentType } from '../../../types';
import Input from '../../shared/Input';
import Select from '../../shared/Select';
import Button from '../../shared/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

const SystemComponentsBuilder: React.FC = () => {
    const { hazards, systemComponents, addSystemComponent, updateSystemComponent, deleteSystemComponent } = useAnalysis();

    const [componentName, setComponentName] = useState('');
    const [componentType, setComponentType] = useState<ComponentType>(ComponentType.Physical);
    const [editingComponentId, setEditingComponentId] = useState<string | null>(null);

    const componentTypeOptions = Object.values(ComponentType).map(ct => ({ value: ct, label: ct }));

    useEffect(() => {
        if (systemComponents.length === 0 && hazards.length > 0) {
            const componentNamesFromHazards = new Set(hazards.map(h => h.systemComponent.trim()).filter(Boolean));
            componentNamesFromHazards.forEach(name => {
                if (!systemComponents.some(sc => sc.name === name)) {
                    addSystemComponent({ name, type: ComponentType.Physical });
                }
            });
        }
    }, [hazards, systemComponents, addSystemComponent]);


    const handleSaveComponent = () => {
        if (!componentName) return;
        if (editingComponentId) {
            updateSystemComponent(editingComponentId, { name: componentName, type: componentType });
        } else {
            addSystemComponent({ name: componentName, type: componentType });
        }
        resetForm();
    };

    const editComponent = (comp: SystemComponent) => {
        setEditingComponentId(comp.id);
        setComponentName(comp.name);
        setComponentType(comp.type);
    };

    const resetForm = () => {
        setEditingComponentId(null);
        setComponentName('');
        setComponentType(ComponentType.Physical);
    }

    return (
        <section className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">System Components</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Start at the bottom of the ladder. What are the basic physical parts or processes your system controls? (e.g., 'The Aircraft', 'The Patient', 'The Database')</p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50">
                <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
                    <Input label="Component Name" value={componentName} onChange={e => setComponentName(e.target.value)} placeholder="e.g., Engine, Database" containerClassName="w-full md:w-auto flex-grow !mb-0"/>
                    <Select label="Component Type" value={componentType} onChange={e => setComponentType(e.target.value as ComponentType)} options={componentTypeOptions} containerClassName="w-full md:w-auto flex-grow !mb-0" />
                    <Button onClick={handleSaveComponent} leftIcon={<PlusIcon className="w-5 h-5" />} className="h-10 w-full md:w-auto">
                        {editingComponentId ? 'Update' : 'Add'}
                    </Button>
                    {editingComponentId && <Button onClick={resetForm} variant="secondary" className="h-10">Cancel</Button>}
                </div>
            </div>

            <ul className="space-y-2">
                {systemComponents.map(comp => (
                    <li key={comp.id} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 shadow-sm">
                        <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{comp.name}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400"> ({comp.type})</span>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                            <Button onClick={() => editComponent(comp)} size="sm" variant="ghost">Edit</Button>
                            <Button onClick={() => deleteSystemComponent(comp.id)} size="sm" variant="ghost" className="text-red-500"><TrashIcon className="w-4 h-4" /></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default SystemComponentsBuilder;