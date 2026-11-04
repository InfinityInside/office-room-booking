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

/** Runs a change and returns a success message, or throws. */
type RunChange = (change: () => string) => void;

interface SectionProps {
    runChange: RunChange;
}

export function AdminGrantsPage() {
    const refresh = useRefresh();
    const [message, setMessage] = useState<string | null>(null);

    /** Runs a change, shows its result or error, and re-renders the whole page. */
    const runChange: RunChange = (change) => {
        try {
            setMessage(change());
        } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Something went wrong.');
        }
        refresh();
    };

    return (
        <>
            <h1>Grants and users</h1>
            {message && <p role="status">{message}</p>}
            <GrantsSection runChange={runChange} />
            <UserGrantsSection runChange={runChange} />
        </>
    );
}

function GrantsSection({ runChange }: SectionProps) {
    const user = useCurrentUser();

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

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

    const handleToggleActive = (grant: Grant) => {
        if (
            grant.active &&
            !window.confirm(`Deactivate ${grant.name}? Its holders lose access to its rooms.`)
        ) {
            return;
        }
        runChange(() => {
            const updated = setGrantActive(user, grant.id, !grant.active);
            return `${updated.name} is now ${updated.active ? 'active' : 'inactive'}.`;
        });
    };

    return (
        <section>
            <h2>Grants</h2>
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Users</th>
                        <th>Rooms</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {getGrants().map((grant) => (
                        <tr key={grant.id}>
                            <td>{grant.code}</td>
                            <td>{grant.name}</td>
                            <td>{grant.type === 'SYSTEM' ? 'System' : 'Room access'}</td>
                            <td>{countUsersWithGrant(grant.id)}</td>
                            <td>
                                {grant.type === 'SYSTEM'
                                    ? 'All rooms'
                                    : getRoomsRequiringGrant(grant.id)
                                          .map((room) => room.name)
                                          .join(', ') || 'None'}
                            </td>
                            <td>{grant.active ? 'Active' : 'Inactive'}</td>
                            <td>
                                {grant.type === 'ROOM_ACCESS' && (
                                    <button type="button" onClick={() => handleToggleActive(grant)}>
                                        {grant.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p>
                <small>Link rooms to grants on the Manage rooms page.</small>
            </p>

            <form onSubmit={handleCreate}>
                <fieldset>
                    <legend>New room-access grant</legend>
                    <label>
                        Code{' '}
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. HR"
                            required
                        />
                    </label>{' '}
                    <label>
                        Name{' '}
                        <input value={name} onChange={(e) => setName(e.target.value)} required />
                    </label>{' '}
                    <label>
                        Description{' '}
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </label>{' '}
                    <button type="submit">Create grant</button>
                </fieldset>
            </form>
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
        <section>
            <h2>Users</h2>
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        {grants.map((grant) => (
                            <th key={grant.id}>
                                {grant.name}
                                {!grant.active && ' (inactive)'}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {users.map((target) => (
                        <tr key={target.id}>
                            <td>
                                {target.firstName} {target.lastName}
                            </td>
                            <td>{target.email}</td>
                            {grants.map((grant) => (
                                <td key={grant.id}>
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
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
