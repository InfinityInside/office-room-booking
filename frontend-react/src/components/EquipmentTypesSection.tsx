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
import { Alert, type Notice } from './ui/Alert.tsx';
import { Table, Td, Th } from './ui/Table.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { Card } from './ui/Card.tsx';
import { Field } from './ui/Field.tsx';
import { ConfirmDialog } from './ConfirmDialog.tsx';

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
    const [notice, setNotice] = useState<Notice | null>(null);
    const [toDelete, setToDelete] = useState<EquipmentType | null>(null); // null = dialog closed

    const equipmentTypes = getEquipmentTypes();

    /** Runs a change, shows its result or error, and tells the parent to re-render. */
    const runChange = (change: () => string) => {
        try {
            setNotice({ tone: 'success', text: change() });
        } catch (e) {
            setNotice({
                tone: 'error',
                text: e instanceof Error ? e.message : 'Something went wrong.',
            });
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
        setNotice(null);
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

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }
        const type = toDelete;
        runChange(() => {
            deleteEquipmentType(user, type.id);
            return `Deleted ${type.name}.`;
        });
        setToDelete(null);
    };

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tight">Equipment types</h2>
                <p className="text-sm text-muted">
                    The equipment rooms can have. Codes are permanent; a type still in use can't be
                    deleted.
                </p>
            </div>

            {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

            <Table>
                <thead>
                    <tr>
                        <Th>Code</Th>
                        <Th>Name</Th>
                        <Th className="text-right">Used by</Th>
                        <Th>
                            <span className="sr-only">Actions</span>
                        </Th>
                    </tr>
                </thead>
                <tbody>
                    {equipmentTypes.map((type) => {
                        const usedBy = countRoomsWithEquipment(type.id);
                        return (
                            <tr
                                key={type.id}
                                className="border-b border-border transition-colors last:border-b-0 hover:bg-neutral-800/40"
                            >
                                <Td className="font-mono text-xs text-muted">{type.code}</Td>
                                <Td>
                                    {renamingId === type.id ? (
                                        <form
                                            onSubmit={handleRename}
                                            className="flex items-center gap-2"
                                        >
                                            <Input
                                                aria-label={`New name for ${type.code}`}
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                required
                                                className="h-9 max-w-56"
                                            />
                                            <Button type="submit" size="sm" variant="primary">
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setRenamingId(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </form>
                                    ) : (
                                        type.name
                                    )}
                                </Td>
                                <Td className="text-right tabular-nums">
                                    {usedBy} {usedBy === 1 ? 'room' : 'rooms'}
                                </Td>
                                <Td>
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => startRename(type)}
                                        >
                                            Rename
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={usedBy > 0}
                                            title={
                                                usedBy > 0
                                                    ? 'Remove it from all rooms first'
                                                    : undefined
                                            }
                                            onClick={() => {
                                                setNotice(null);
                                                setToDelete(type);
                                            }}
                                            className="text-red-300 enabled:hover:bg-red-500/10 enabled:hover:text-red-200"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </Td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>

            <Card>
                <h3 className="mb-4 text-sm font-medium">Add an equipment type</h3>
                <form
                    onSubmit={handleCreate}
                    className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                    <Field label="Code">
                        <Input
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                            placeholder="SPEAKERPHONE"
                            required
                        />
                    </Field>
                    <Field label="Name">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Speakerphone"
                            required
                        />
                    </Field>
                    <Button type="submit" variant="primary">
                        Add type
                    </Button>
                </form>
            </Card>

            <ConfirmDialog
                open={toDelete !== null}
                title="Delete this equipment type?"
                description={
                    toDelete && (
                        <>
                            "{toDelete.name}" ({toDelete.code}) will be removed. No rooms use it, so
                            nothing else changes.
                        </>
                    )
                }
                confirmLabel="Delete type"
                cancelLabel="Keep it"
                tone="danger"
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </section>
    );
}
