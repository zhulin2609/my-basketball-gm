import { useState } from 'react';
import { Switch } from '@tarojs/components';

interface LineupMemberSwitchProps {
  checked: boolean;
  onChange: (enabled: boolean) => boolean;
}

export function LineupMemberSwitch({ checked, onChange }: LineupMemberSwitchProps) {
  const [generation, setGeneration] = useState(0);
  return (
    <Switch
      key={generation}
      color="#8bbf80"
      checked={checked}
      onChange={(event) => {
        if (!onChange(event.detail.value)) {
          // 微信原生开关已切换，拒绝操作时重新挂载以恢复 checked。
          setGeneration((value) => value + 1);
        }
      }}
    />
  );
}
