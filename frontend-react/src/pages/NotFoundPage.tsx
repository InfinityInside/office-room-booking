import { Link } from 'react-router';

export function NotFoundPage() {
    return (
        <>
            <h1>Page not found</h1>
            <p>This address doesn't match any page.</p>
            <Link to="/">Go back</Link>
        </>
    );
}
