import { useMemo, useState } from 'react';
import { Button, Input, Picker, Text, View } from '@tarojs/components';
import {
  filterSortPlayers,
  STARTER_POSITIONS,
  type Player,
  type PlayerSortKey,
  type Position,
} from '@dream-court/core';
import { PlayerCard } from '@/components/PlayerCard';
import { navigate } from '@/platform/navigation';

interface PlayerBrowserProps {
  players: Player[];
  selectedIds?: string[];
  onSelect?: (player: Player) => void;
  disabled?: boolean;
}

const positions: Array<Position | 'ALL'> = ['ALL', ...STARTER_POSITIONS];
const sorts: PlayerSortKey[] = ['overall', 'threePoint', 'salaryUsd'];
const sortLabels = ['综合评分', '三分能力', '薪资'];
const PAGE_SIZE = 12;

export function PlayerBrowser({ players, selectedIds, onSelect, disabled }: PlayerBrowserProps) {
  const [query, setQuery] = useState('');
  const [positionIndex, setPositionIndex] = useState(0);
  const [sortIndex, setSortIndex] = useState(0);
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      filterSortPlayers(players, {
        query,
        position: positions[positionIndex],
        sort: sorts[sortIndex],
      }),
    [players, query, positionIndex, sortIndex],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <View>
      <Input
        className="input"
        placeholder="搜索英文名、中文名或球员定位"
        value={query}
        maxlength={120}
        onInput={(event) => {
          setQuery(event.detail.value);
          setPage(1);
        }}
      />
      <View className="filters">
        <Picker
          range={['全部位置', ...STARTER_POSITIONS]}
          value={positionIndex}
          onChange={(event) => {
            setPositionIndex(Number(event.detail.value));
            setPage(1);
          }}
        >
          <View className="select">
            位置：{positionIndex === 0 ? '全部' : positions[positionIndex]}
          </View>
        </Picker>
        <Picker
          range={sortLabels}
          value={sortIndex}
          onChange={(event) => {
            setSortIndex(Number(event.detail.value));
            setPage(1);
          }}
        >
          <View className="select">排序：{sortLabels[sortIndex]}</View>
        </Picker>
      </View>
      <View className="muted">{filtered.length} 名球员</View>
      {visible.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          onDetails={() =>
            navigate(`/pages/player-detail/index?id=${encodeURIComponent(player.id)}`)
          }
          onSelect={onSelect ? () => onSelect(player) : undefined}
          selected={selectedIds?.includes(player.id)}
          disabled={disabled}
        />
      ))}
      {!visible.length && <View className="notice">没有符合条件的球员</View>}
      <View className="actions pagination">
        <Button
          size="mini"
          className="secondary"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          上一页
        </Button>
        <Text>
          {currentPage} / {pageCount}
        </Text>
        <Button
          size="mini"
          className="secondary"
          disabled={currentPage === pageCount}
          onClick={() => setPage(currentPage + 1)}
        >
          下一页
        </Button>
      </View>
    </View>
  );
}
