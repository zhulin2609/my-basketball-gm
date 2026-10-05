import { ScrollView, Text, View } from '@tarojs/components';
import type { PlayerStat } from '@dream-court/core';

interface ReportStatsProps {
  name: string;
  stats: PlayerStat[];
}

export function ReportStats({ name, stats }: ReportStatsProps) {
  return (
    <View className="card">
      <View className="name">{name}</View>
      <ScrollView scrollX className="stats-scroll">
        <View className="stat-row stat-heading">
          {['球员', '分钟', '得分', '篮板', '助攻', '抢断', '盖帽', '投篮', '三分'].map((label) => (
            <Text key={label}>{label}</Text>
          ))}
        </View>
        {stats.map((stat) => (
          <View className="stat-row" key={stat.playerId}>
            <Text>{stat.playerName ?? stat.playerId}</Text>
            <Text>{stat.minutes}</Text>
            <Text>{stat.points}</Text>
            <Text>{stat.rebounds}</Text>
            <Text>{stat.assists}</Text>
            <Text>{stat.steals}</Text>
            <Text>{stat.blocks}</Text>
            <Text>
              {stat.fgMade}/{stat.fgAttempted}
            </Text>
            <Text>
              {stat.threeMade}/{stat.threeAttempted}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
