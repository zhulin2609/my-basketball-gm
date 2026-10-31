export function readForumEnabled(value: string | undefined): boolean {
  if (value === undefined || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('VITE_FORUM_ENABLED must be true or false');
}

export const isForumEnabled = readForumEnabled(import.meta.env.VITE_FORUM_ENABLED);

export function readWebAuthEnabled(value: string | undefined): boolean {
  if (value === undefined || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('VITE_WEB_AUTH_ENABLED must be true or false');
}

export const isWebAuthEnabled = readWebAuthEnabled(import.meta.env.VITE_WEB_AUTH_ENABLED);
