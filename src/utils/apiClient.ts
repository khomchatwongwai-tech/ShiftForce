import { auth } from '../firebase/config';

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to use this feature.');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
