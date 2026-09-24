import { v4 as uuidV4 } from 'uuid';

export function createIdentifier(): string {
  return uuidV4();
}
