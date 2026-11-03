import { useState, type SubmitEvent } from 'react';
import {
    countRoomsWithEquipment,
    createEquipmentType,
    deleteEquipmentType,
    getEquipmentTypes,
    renameEquipmentType,
} from '../api/mockApi';
import { useCurrentUser } from '../auth/AuthContext';
import type { EquipmentType } from '../types';

interface EquipmentTypesSectionProps {
    /** Called after any change, so the parent can re-render with fresh data. */
    onChanged: () => void;
}

export function EquipmentTypesSection({ onChanged }: EquipmentTypesSectionProps) {
    const user = useCurrentUser();

    const [newCode, setNewCode] = useState('');
    const [newName, setNewName] = useState('');
    const [renamingId, setRenamingId] = useState<number | null>(null); // null = not renaming
    const [renameValue, setRenameValue] = useState('');
    const [message, setMessage] = useState<string | null>(null);

    const equipmentTypes = getEquipmentTypes();

    /** Runs a change, shows its result or error, and tells the parent to re-render. */
    const runChange = (change: () => string) => {
        try {
            setMessage(change());
        } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Something went wrong.');
        }
        onChanged();
    };

    const handleCreate = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        runChange(() => {
            const created = createEquipmentType(user, newCode, newName);
            setNewCode('');
            setNewName('');
            return `Added ${created.name}.`;
        });
    };

    const startRename = (type: EquipmentType) => {
        setMessage(null);
        setRenamingId(type.id);
        setRenameValue(type.name);
    };

    const handleRename = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (renamingId === null) {
            return;
        }
        runChange(() => {
            const updated = renameEquipmentType(user, renamingId, renameValue);
            setRenamingId(null);
            return `Renamed to ${updated.name}.`;
        });
    };

    const handleDelete = (type: EquipmentType) => {
        if (!window.confirm(`Delete "${type.name}"?`)) {
            return;
        }
        runChange(() => {
            deleteEquipmentType(user, type.id);
            return `Deleted ${type.name}.`;
        });
    };

    return (
        <section>
            <h2>Equipment types</h2>
            {message && <p role="status">{message}</p>}

            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Used by</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {equipmentTypes.map((type) => {
                        const usedBy = countRoomsWithEquipment(type.id);
                        return (
                            <tr key={type.id}>
                                <td>{type.code}</td>
                                <td>
                                    {renamingId === type.id ? (
                                        <form onSubmit={handleRename}>
                                            <input
                                                aria-label={`New name for ${type.code}`}
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                required
                                            />{' '}
                                            <button type="submit">Save</button>{' '}
                                            <button
                                                type="button"
                                                onClick={() => setRenamingId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    ) : (
                                        type.name
                                    )}
                                </td>
                                <td>
                                    {usedBy} {usedBy === 1 ? 'room' : 'rooms'}
                                </td>
                                <td>
                                    <button type="button" onClick={() => startRename(type)}>
                                        Rename
                                    </button>{' '}
                                    <button
                                        type="button"
                                        disabled={usedBy > 0}
                                        title={
                                            usedBy > 0
                                                ? 'Remove it from all rooms first'
                                                : undefined
                                        }
                                        onClick={() => handleDelete(type)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <form onSubmit={handleCreate}>
                <fieldset>
                    <legend>New equipment type</legend>
                    <label>
                        Code{' '}
                        <input
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                            placeholder="e.g. SPEAKERPHONE"
                            required
                        />
                    </label>{' '}
                    <label>
                        Name{' '}
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Speakerphone"
                            required
                        />
                    </label>{' '}
                    <button type="submit">Add type</button>
                </fieldset>
            </form>
        </section>
    );
}
