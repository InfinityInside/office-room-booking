import { useState, type SubmitEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

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
            navigate('/rooms', { replace: true });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Registration failed.');
        }
    }

    return (
        <>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <p>
                    <label>
                        First name
                        <input
                            value={form.firstName}
                            onChange={(e) => updateField('firstName', e.target.value)}
                            autoComplete="given-name"
                            required
                        />
                    </label>
                </p>
                <p>
                    <label>
                        Last name
                        <input
                            value={form.lastName}
                            onChange={(e) => updateField('lastName', e.target.value)}
                            autoComplete="family-name"
                            required
                        />
                    </label>
                </p>
                <p>
                    <label>
                        Email
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </label>
                </p>
                <p>
                    <label>
                        Password
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => updateField('password', e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </label>
                </p>
                <p>
                    <label>
                        Confirm password
                        <input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </label>
                </p>
                {error && <p role="alert">{error}</p>}
                <button type="submit">Create account</button>
            </form>
            <p>
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </>
    );
}
