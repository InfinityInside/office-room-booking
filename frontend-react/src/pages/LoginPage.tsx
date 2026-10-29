import { useAuth } from '../auth/AuthContext.ts';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState, type SubmitEvent } from 'react';

export function LoginPage() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // Where the user tried to go before RequireAuth sent them here.
    const from = (location.state as { from?: string } | null)?.from ?? '/';

    if (user) {
        navigate(from, { replace: true });
    }

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!login(email, password)) {
            setError('Wrong email or password.');
            return;
        }
        navigate(from, { replace: true});
    }

    return (
        <>
            <h1>Log in</h1>
            <form onSubmit={handleSubmit}>
                <p>
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                </p>
                <p>
                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                </p>
                {error && <p>{error}</p>}
                <button type="submit">Log in</button>
            </form>
            <p>
                No account yet? <Link to="/register">Register</Link>
            </p>
            <p>
                <small>
                    Demo accounts (any password): anna@office.test (admin), tom@office.test,
                    ivy@office.test (IT grant)
                </small>
            </p>
        </>
    );
}
