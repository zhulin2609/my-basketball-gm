import { Screen } from '@/components/Screen';
import { PlayerBrowser } from '@/components/PlayerBrowser';

export default function PlayersPage() {
  return (
    <Screen title="球员库">{(_store, data) => <PlayerBrowser players={data.players} />}</Screen>
  );
}
