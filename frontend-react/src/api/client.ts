import createClient from 'openapi-fetch';
import type { paths } from './schema';

/**
 * The typed API client. Every path, parameter, request body and response
 * is checked against the contract at compile time.
 */
export const api = createClient<paths>({ baseUrl: '/api' });
