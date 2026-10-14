import { useEffect, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import type { IdentityInfo } from '@dream-court/client';
import { Screen } from '@/components/Screen';
import { api, logoutAccount, refreshRuntime } from '@/services/runtime';
import type { DataSnapshot } from '@/services/data-store';
import { navigate } from '@/platform/navigation';
import { errorMessage } from '@/constants/text';

function GuestView({ data }: { data: DataSnapshot }) {
  return (
    <View>
      <View className="card">
        <View className="name">游客工作区</View>
        <View className="paragraph">阵容和战报保存在当前设备，关闭后重新打开可以继续使用。</View>
        <View className="metrics">
          <View>{data.lineups.length} 套阵容</View>
          <View>{data.reports.length} 场有效战报</View>
        </View>
        <View className="muted">{data.hasUserProgress ? '已有个人进度' : '当前使用内置示例'}</View>
        <Button className="secondary" onClick={() => navigate('/pages/reports/index')}>
          查看历史战报
        </Button>
      </View>
      <View className="card">
        <View className="name">账号</View>
        <View className="paragraph">登录后阵容和战报保存到账号，可在网页端继续使用。</View>
        <Button className="primary" onClick={() => navigate('/pages/auth/index')}>
          微信登录
        </Button>
      </View>
      <View className="card muted">篮球模拟工具，球员能力用于游戏规则计算。</View>
    </View>
  );
}

function AccountView({ data }: { data: DataSnapshot }) {
  const [identities, setIdentities] = useState<IdentityInfo[] | null>(null);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .listIdentities()
      .then((result) => {
        if (active) setIdentities(result);
      })
      .catch((failure: unknown) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    if (leaving) return;
    const confirmed = await Taro.showModal({
      title: '退出登录',
      content: '退出后恢复为游客工作区，本机的游客数据不受影响。',
      confirmText: '退出',
    });
    if (!confirmed.confirm) return;
    setLeaving(true);
    setError('');
    try {
      await logoutAccount();
    } catch (failure: unknown) {
      setError(errorMessage(failure));
      setLeaving(false);
    }
  };

  const user = data.user;
  if (!user) return null;
  return (
    <View>
      <View className="card">
        <View className="name">{user.username}</View>
        <View className="metrics">
          <View>{data.lineups.length} 套阵容</View>
          <View>{data.reports.length} 场有效战报</View>
        </View>
        <View className="muted">
          {identities === null
            ? '正在读取绑定状态…'
            : identities.some((identity) => identity.provider === 'wechat')
              ? '已绑定微信'
              : '未绑定微信'}
        </View>
        {error && <View className="error">{error}</View>}
        <Button className="secondary" onClick={() => navigate('/pages/reports/index')}>
          查看历史战报
        </Button>
        <Button
          className="secondary"
          loading={leaving}
          disabled={leaving}
          onClick={() => void logout()}
        >
          退出登录
        </Button>
      </View>
      <View className="card muted">篮球模拟工具，球员能力用于游戏规则计算。</View>
    </View>
  );
}

export default function AccountPage() {
  useDidShow(refreshRuntime);
  return (
    <Screen title="我的">
      {(_store, data) =>
        data.source === 'account' ? <AccountView data={data} /> : <GuestView data={data} />
      }
    </Screen>
  );
}
