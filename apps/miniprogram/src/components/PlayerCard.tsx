import { Button, Text, View } from '@tarojs/components';
import { averageRating, displayPlayerName, type Player } from '@dream-court/core';

interface PlayerCardProps {
  player: Player;
  onDetails: () => void;
  onSelect?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function PlayerCard({ player, onDetails, onSelect, selected, disabled }: PlayerCardProps) {
  return (
    <View className="card">
      <View className="row">
        <View className="portrait" style={{ backgroundColor: player.accent }}>
          {player.initials}
        </View>
        <View className="grow">
          <View className="name">{displayPlayerName(player, 'zh-CN')}</View>
          <Text className="muted">
            {player.defaultPosition} · {player.peakSeason} · {player.peakTeam}
          </Text>
        </View>
        <Text className="rating">{averageRating(player)}</Text>
      </View>
      <View className="metrics">
        <Text>三分 {player.threePoint}</Text>
        <Text>传球 {player.passing}</Text>
        <Text>薪资 ${(player.salaryUsd / 1000000).toFixed(1)}M</Text>
      </View>
      <View className="actions">
        <Button size="mini" className="secondary" onClick={onDetails}>
          查看详情
        </Button>
        {onSelect && (
          <Button
            size="mini"
            className="primary"
            disabled={disabled || selected}
            onClick={onSelect}
          >
            {selected ? '已加入' : '加入阵容'}
          </Button>
        )}
      </View>
    </View>
  );
}
