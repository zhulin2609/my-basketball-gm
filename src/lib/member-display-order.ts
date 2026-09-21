import type { Position } from '@/types';

// 首发成员的展示顺序：中锋到控卫，与篮球站位图的常规阅读顺序一致。
const starterDisplayOrder: Position[] = ['C', 'PF', 'SF', 'SG', 'PG'];

interface MemberOrderFields {
  position: Position;
  starter: boolean;
  inactive: boolean;
}

// 阵容成员的展示顺序：激活的首发按站位顺序排在前五位，其余成员保持原相对顺序。
// 仅用于渲染，不改写阵容的存储顺序；阵容编辑表与社区帖子成员表共用。
export function orderMembersForDisplay<T extends MemberOrderFields>(members: T[]): T[] {
  return members
    .map((member, index) => ({ member, index }))
    .sort((left, right) => {
      const leftIsStarter = left.member.starter && !left.member.inactive;
      const rightIsStarter = right.member.starter && !right.member.inactive;

      if (leftIsStarter !== rightIsStarter) return leftIsStarter ? -1 : 1;
      if (leftIsStarter && rightIsStarter) {
        return (
          starterDisplayOrder.indexOf(left.member.position) -
          starterDisplayOrder.indexOf(right.member.position)
        );
      }

      return left.index - right.index;
    })
    .map((entry) => entry.member);
}
