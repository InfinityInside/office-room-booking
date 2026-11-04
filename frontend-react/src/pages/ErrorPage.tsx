import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export function ErrorPage() {
    const error = useRouteError();

    let details: string;
    if (isRouteErrorResponse(error)) {
        details = `${error.status} ${error.statusText}`;
    } else if (error instanceof Error) {
        details = error.message;
    } else {
        details = 'Unknown error';
    }

    return (
        <>
            <h1>Something went wrong</h1>
            <p>Sorry, this page ran into a problem. Try again, or go back to room search.</p>
            {import.meta.env.DEV && <pre>{details}</pre>}
            <p>
                <Link to="/rooms">Go to room search</Link>{' '}
                <button type="button" onClick={() => window.location.reload()}>
                    Reload page
                </button>
            </p>
        </>
    );
}
