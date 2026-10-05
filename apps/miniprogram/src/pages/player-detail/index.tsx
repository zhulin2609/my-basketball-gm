import { useRouter } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { displayPlayerName } from '@dream-court/core';
import { Screen } from '@/components/Screen';
import { ratingLabels } from '@/constants/text';
import { navigate } from '@/platform/navigation';

export default function PlayerDetailPage() {
  const { params } = useRouter();
  return (
    <Screen title="球员详情">
      {(_store, data) => {
        const player = data.players.find((item) => item.id === params.id);
        if (!player) return <View className="error">球员已经无法读取</View>;
        return (
          <View>
            <View className="card">
              <View className="name">{displayPlayerName(player, 'zh-CN')}</View>
              <View className="muted">
                {player.defaultPosition} · {player.peakSeason} · {player.peakTeam}
              </View>
              <View className="paragraph">
                {player.heightFeet} 英尺 {player.heightInches} 英寸 · {player.weightLbs} 磅
              </View>
              <View className="paragraph">{player.archetype}</View>
              <Text>{player.bio}</Text>
            </View>
            <View className="card ratings">
              {Object.entries(ratingLabels).map(([key, label]) => (
                <View className="metric" key={key}>
                  <Text className="muted">{label}</Text>
                  <Text>{player[key as keyof typeof ratingLabels]}</Text>
                </View>
              ))}
            </View>
            <Button
              className="primary"
              onClick={() =>
                navigate(`/pages/player-picker/index?playerId=${encodeURIComponent(player.id)}`)
              }
            >
              选择阵容
            </Button>
          </View>
        );
      }}
    </Screen>
  );
}
