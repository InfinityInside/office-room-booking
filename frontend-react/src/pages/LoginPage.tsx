import { useAuth } from '../auth/AuthContext.ts';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useState, type SubmitEvent } from 'react';
import { Field } from '../components/ui/Field.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';

export function LoginPage() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (user) {
        return <Navigate to={from} replace />;
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!login(email, password)) {
            setError('Wrong email or password.');
            return;
        }
        navigate(from, { replace: true });
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-6">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>

                <Card>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Field label="Email">
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </Field>
                        <Field label="Password">
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </Field>

                        {error && <Alert tone="error">{error}</Alert>}

                        <Button type="submit" variant="primary" className="w-full">
                            Log in
                        </Button>
                    </form>
                </Card>

                <p className="text-sm text-muted">
                    No account yet?{' '}
                    <Link to="/register" className="font-medium text-brand hover:text-brand-hover">
                        Register
                    </Link>
                </p>

                <p className="rounded-lg border border-border px-3 py-2 text-xs text-muted">
                    Demo accounts (any password): anna@office.test (admin), tom@office.test,
                    ivy@office.test (IT grant)
                </p>
            </div>
        </main>
    );
}
