import { mergePlayerCatalog, type Player } from '@dream-court/core';
import {
  createGuestImportRequest,
  createGuestRepositories,
  type ApiClient,
  type GuestWorkspaceDeps,
} from '@dream-court/client';
import { DRAFTS_KEY, clearGuestDrafts } from './guest-store';

export async function importGuestSnapshot(
  deps: GuestWorkspaceDeps & { api: ApiClient; catalog: Player[] },
): Promise<'empty' | 'imported'> {
  const repositories = createGuestRepositories(deps);
  const workspace = repositories.workspace.peek();
  if (!workspace?.hasUserProgress) return 'empty';
  const drafts = deps.storage.getItem(DRAFTS_KEY);
  if (drafts && Object.keys(JSON.parse(drafts) as Record<string, unknown>).length) {
    throw new Error('游客阵容还有未保存的修改，请先保存后再导入。');
  }
  const token = deps.api.readSession()?.accessToken;
  if (!token) throw new Error('请先登录后再导入。');
  const submitted = JSON.stringify(workspace);
  const players = mergePlayerCatalog(deps.catalog, repositories.players.list());
  await deps.api.importGuestWorkspace(createGuestImportRequest(workspace, players));
  if (
    deps.api.readSession()?.accessToken !== token ||
    JSON.stringify(repositories.workspace.peek()) !== submitted ||
    deps.storage.getItem(DRAFTS_KEY) !== drafts
  )
    return 'imported';
  repositories.workspace.clear();
  clearGuestDrafts(deps.storage);
  return 'imported';
}
