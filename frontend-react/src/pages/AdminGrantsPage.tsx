import { useState, type SubmitEvent } from 'react';
import {
    countUsersWithGrant,
    createGrant,
    getGrants,
    getRoomsRequiringGrant,
    getUsers,
    setGrantActive,
    setUserGrant,
} from '../api/mockApi';
import { useCurrentUser } from '../auth/AuthContext';
import { SYSTEM_GRANTS } from '../grants';
import { useRefresh } from '../hooks/useRefresh';
import type { Grant, User } from '../types';
import { Alert, type Notice } from '../components/ui/Alert.tsx';
import { Table, Td, Th } from '../components/ui/Table.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Field } from '../components/ui/Field.tsx';
import { Input } from '../components/ui/Input.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';

/** Runs a change and returns a success message, or throws. */
type RunChange = (change: () => string) => void;

interface SectionProps {
    runChange: RunChange;
}

export function AdminGrantsPage() {
    const refresh = useRefresh();
    const [notice, setNotice] = useState<Notice | null>(null);

    /** Runs a change, shows its result or error, and re-renders the whole page. */
    const runChange: RunChange = (change) => {
        try {
            setNotice({ tone: 'success', text: change() });
        } catch (e) {
            setNotice({
                tone: 'error',
                text: e instanceof Error ? e.message : 'Something went wrong.',
            });
        }
        refresh();
    };

    return (
        <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-semibold tracking-tight">Grants and users</h1>
                    <p className="text-sm text-muted">
                        Grants decide who can use admin pages and who can book restricted rooms.
                    </p>
                </div>
                {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
                <GrantsSection runChange={runChange} />
            </div>
            <UserGrantsSection runChange={runChange} />
        </div>
    );
}

function GrantsSection({ runChange }: SectionProps) {
    const user = useCurrentUser();

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [toDeactivate, setToDeactivate] = useState<Grant | null>(null); // null = dialog closed

    const handleCreate = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        runChange(() => {
            const created = createGrant(user, code, name, description);
            setCode('');
            setName('');
            setDescription('');
            return `Created ${created.name}.`;
        });
    };

    const changeActive = (grant: Grant, active: boolean) => {
        runChange(() => {
            const updated = setGrantActive(user, grant.id, active);
            return `${updated.name} is now ${updated.active ? 'active' : 'inactive'}.`;
        });
    };

    const confirmDeactivate = () => {
        if (!toDeactivate) {
            return;
        }
        changeActive(toDeactivate, false);
        setToDeactivate(null);
    };

    return (
        <section className="flex flex-col gap-6">
            <h2 className="sr-only">Grants</h2>

            <Table>
                <thead>
                    <tr>
                        <Th>Code</Th>
                        <Th>Name</Th>
                        <Th>Type</Th>
                        <Th className="text-right">Users</Th>
                        <Th>Rooms</Th>
                        <Th>Status</Th>
                        <Th>
                            <span className="sr-only">Actions</span>
                        </Th>
                    </tr>
                </thead>
                <tbody>
                    {getGrants().map((grant) => {
                        const isSystem = grant.type === 'SYSTEM';
                        const rooms = getRoomsRequiringGrant(grant.id).map((room) => room.name);

                        return (
                            <tr
                                key={grant.id}
                                className="border-b border-border transition-colors last:border-b-0 hover:bg-neutral-800/40"
                            >
                                <Td className="font-mono text-xs text-muted">{grant.code}</Td>
                                <Td>
                                    <div className="font-medium">{grant.name}</div>
                                    {grant.description && (
                                        <div className="max-w-64 truncate text-xs text-muted">
                                            {grant.description}
                                        </div>
                                    )}
                                </Td>
                                <Td>
                                    <Badge tone={isSystem ? 'brand' : 'neutral'}>
                                        {isSystem ? 'System' : 'Room access'}
                                    </Badge>
                                </Td>
                                <Td className="text-right tabular-nums">
                                    {countUsersWithGrant(grant.id)}
                                </Td>
                                <Td
                                    className={
                                        rooms.length === 0 && !isSystem ? 'text-muted' : undefined
                                    }
                                >
                                    {isSystem ? 'All rooms' : rooms.join(', ') || 'None'}
                                </Td>
                                <Td>{!grant.active && <Badge tone="danger">Inactive</Badge>}</Td>
                                <Td className="text-right">
                                    {!isSystem &&
                                        (grant.active ? (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setToDeactivate(grant)}
                                                className="text-red-300 enabled:hover:bg-red-500/10 enabled:hover:text-red-200"
                                            >
                                                Deactivate
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => changeActive(grant, true)}
                                            >
                                                Activate
                                            </Button>
                                        ))}
                                </Td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>

            <Card>
                <h3 className="mb-1 text-sm font-medium">Create a room-access grant</h3>
                <p className="mb-4 text-xs text-muted">
                    Link it to rooms on the Manage rooms page, then give it to users below.
                </p>
                <form
                    onSubmit={handleCreate}
                    className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto]"
                >
                    <Field label="Code">
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="HR"
                            required
                        />
                    </Field>
                    <Field label="Name">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Human resources"
                            required
                        />
                    </Field>
                    <Field label="Description">
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional"
                        />
                    </Field>
                    <Button type="submit" variant="primary">
                        Create grant
                    </Button>
                </form>
            </Card>

            <ConfirmDialog
                open={toDeactivate !== null}
                title="Deactivate this grant?"
                description={
                    toDeactivate && (
                        <>
                            Users holding "{toDeactivate.name}" lose access to its rooms until it's
                            activated again. The rooms stay restricted; they don't become open to
                            everyone.
                        </>
                    )
                }
                confirmLabel="Deactivate"
                cancelLabel="Keep active"
                tone="danger"
                onConfirm={confirmDeactivate}
                onCancel={() => setToDeactivate(null)}
            />
        </section>
    );
}

function UserGrantsSection({ runChange }: SectionProps) {
    const user = useCurrentUser();

    const grants = getGrants();
    const users = getUsers().sort((a, b) => a.lastName.localeCompare(b.lastName));

    const isOwnAdminGrant = (target: User, grant: Grant) =>
        target.id === user.id && grant.code === SYSTEM_GRANTS.ADMIN;

    const handleToggle = (target: User, grant: Grant) => {
        const hasGrant = target.grantIds.includes(grant.id);
        runChange(() => {
            setUserGrant(user, target.id, grant.id, !hasGrant);
            return hasGrant
                ? `Removed ${grant.name} from ${target.firstName}.`
                : `Gave ${grant.name} to ${target.firstName}.`;
        });
    };

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tight">Users</h2>
                <p className="text-sm text-muted">Tick a box to give a user that grant.</p>
            </div>

            <Table>
                <thead>
                    <tr>
                        <Th className="sticky left-0 z-10 bg-surface">User</Th>
                        {grants.map((grant) => (
                            <Th key={grant.id} className="text-center">
                                {grant.name}
                                {!grant.active && (
                                    <span className="ml-1 font-normal">(inactive)</span>
                                )}
                            </Th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {users.map((target) => (
                        <tr key={target.id} className="border-b border-border last:border-b-0">
                            <Td className="sticky left-0 z-10 bg-surface">
                                <div className="font-medium whitespace-nowrap">
                                    {target.firstName} {target.lastName}
                                </div>
                                <div className="text-xs text-muted">{target.email}</div>
                            </Td>
                            {grants.map((grant) => (
                                <Td key={grant.id} className="text-center">
                                    <input
                                        type="checkbox"
                                        aria-label={`${grant.name} for ${target.firstName} ${target.lastName}`}
                                        checked={target.grantIds.includes(grant.id)}
                                        disabled={isOwnAdminGrant(target, grant)}
                                        title={
                                            isOwnAdminGrant(target, grant)
                                                ? "You can't remove your own Admin grant"
                                                : undefined
                                        }
                                        onChange={() => handleToggle(target, grant)}
                                        className="size-4 accent-brand disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </Td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </section>
    );
}
