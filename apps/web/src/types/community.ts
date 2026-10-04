import type { Player, Position } from '@dream-court/core';

/** Web 社区（论坛公开阵容）专属类型；共享包不感知这些结构。 */

export interface CommunityPostMember {
  playerId: string;
  position: Position;
  starter: boolean;
  inactive: boolean;
  player: Player;
}

export interface CommunityPostSummary {
  id: string;
  name: string;
  description: string;
  authorName: string;
  memberCount: number;
  commentCount: number;
  copyCount: number;
  mine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostDetail extends CommunityPostSummary {
  members: CommunityPostMember[];
}

export interface CommunityComment {
  id: string;
  authorName: string;
  content: string;
  parentId: string | null;
  parentAuthorName: string | null;
  mine: boolean;
  createdAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
