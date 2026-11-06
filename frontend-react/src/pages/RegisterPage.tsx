import { useState, type SubmitEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/ui/Card.tsx';
import { Field } from '../components/ui/Field.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';

const MIN_PASSWORD_LENGTH = 8;

interface RegisterForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const EMPTY_FORM: RegisterForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
};

export function RegisterPage() {
    const { register, user } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);

    if (user) {
        return <Navigate to="/" replace />;
    }

    function updateField(name: keyof RegisterForm, value: string) {
        setForm((current) => ({ ...current, [name]: value }));
    }

    /** Returns an error message, or null if the form is valid. */
    function validate(): string | null {
        if (form.password.length < MIN_PASSWORD_LENGTH) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }
        if (form.password !== form.confirmPassword) {
            return 'Passwords do not match.';
        }
        return null;
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            register({
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                password: form.password,
            });
            navigate('/', { replace: true });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Registration failed.');
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-6">
            <div className="flex w-full max-w-md flex-col gap-6">
                <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>

                <Card>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="First name">
                                <Input
                                    value={form.firstName}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                    autoComplete="given-name"
                                    required
                                />
                            </Field>
                            <Field label="Last name">
                                <Input
                                    value={form.lastName}
                                    onChange={(e) => updateField('lastName', e.target.value)}
                                    autoComplete="family-name"
                                    required
                                />
                            </Field>
                        </div>
                        <Field label="Email">
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </Field>
                        <Field label="Password">
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) => updateField('password', e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </Field>
                        <Field label="Confirm Password">
                            <Input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </Field>
                        {error && <Alert tone="error">{error}</Alert>}
                        <Button type="submit" variant="primary" className="w-full">
                            Create account
                        </Button>
                    </form>
                </Card>

                <p className="text-sm text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-brand hover:text-brand-hover">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}
