import { useEffect, useRef, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Button, Input, View } from '@tarojs/components';
import { isValidUsername } from '@dream-court/core';
import { ApiError } from '@dream-court/client';
import { PageShell } from '@/components/Screen';
import { PasswordInput } from '@/components/PasswordInput';
import { authenticateWechatAccount } from '@/services/account-auth';
import {
  api,
  hasGuestProgress,
  importGuestProgress,
  loginWithSession,
  refreshRuntimeAsync,
} from '@/services/runtime';
import { wxLoginCode } from '@/platform/wechat-auth';
import { errorMessage } from '@/constants/text';

type AuthStep =
  | { step: 'starting' }
  | { step: 'choose'; credentialToken: string }
  | { step: 'import-choice' }
  | { step: 'confirm-ticket' }
  | { step: 'done'; message: string }
  | { step: 'failed'; message: string };

function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'WECHAT_NOT_CONFIGURED':
        return '微信登录能力未配置，请稍后再试';
      case 'WECHAT_CODE_INVALID':
        return '微信登录凭证已失效，请重新操作';
      case 'CREDENTIAL_INVALID':
        return '身份确认已过期，请重新登录';
      case 'IDENTITY_CONFLICT':
        return '该微信已绑定其他账号，或当前账号已绑定其他微信';
      case 'RATE_LIMITED':
        return '操作太频繁，请稍后再试';
      case 'TICKET_EXPIRED':
        return '登录请求已过期，请回到网页重新扫码';
      case 'TICKET_RESOLVED':
        return '该登录请求已被处理';
      default:
        return error.message;
    }
  }
  return errorMessage(error);
}

function AuthContent() {
  const { params } = useRouter();
  const ticket = typeof params.scene === 'string' ? decodeURIComponent(params.scene) : '';
  const [state, setState] = useState<AuthStep>({ step: 'starting' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bindMode, setBindMode] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [renewCredential, setRenewCredential] = useState(false);
  const requestPending = useRef(false);

  const finish = async () => {
    if (ticket) {
      setState({ step: 'confirm-ticket' });
      return;
    }
    await Taro.switchTab({ url: '/pages/account/index' });
  };

  // 新账号自动导入游客进度；登录或绑定已有账号时由用户选择是否导入。
  const proceedAfterLogin = async (newAccount: boolean) => {
    if (newAccount) {
      await importGuestProgress();
      // 导入绕过数据源直接写服务器，账号快照还停留在导入前，刷新后再进入页面。
      await refreshRuntimeAsync();
      await finish();
      return;
    }
    if (hasGuestProgress()) {
      setState({ step: 'import-choice' });
      return;
    }
    await finish();
  };

  const startLogin = async () => {
    setState({ step: 'starting' });
    setFormError('');
    try {
      if (api.readSession()) {
        await proceedAfterLogin(false);
        return;
      }
      const code = await wxLoginCode();
      const result = await api.wechatExchange(code);
      if (result.status === 'authenticated' && result.session) {
        await loginWithSession(result.session);
        await proceedAfterLogin(false);
        return;
      }
      if (result.credentialToken) {
        setRenewCredential(false);
        setState({ step: 'choose', credentialToken: result.credentialToken });
        return;
      }
      throw new Error('微信登录返回了无法识别的结果');
    } catch (error: unknown) {
      setState({ step: 'failed', message: authErrorMessage(error) });
    }
  };

  useEffect(() => {
    void startLogin();
    // 进入页面执行一次微信登录；失败后由用户主动重试。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (state.step !== 'choose' || requestPending.current || renewCredential) return;
    const { credentialToken } = state;
    if (!isValidUsername(username)) {
      setFormError('用户名需要 2–32 位汉字、字母、数字、下划线或连字符');
      return;
    }
    requestPending.current = true;
    setSubmitting(true);
    setFormError('');
    try {
      const result = await authenticateWechatAccount(api, {
        credentialToken,
        username,
        password,
        bindMode,
      });
      if (result.status === 'rejected') {
        setFormError(result.message);
        setRenewCredential(result.renewCredential);
        return;
      }
      setPassword('');
      setState({ step: 'starting' });
      await loginWithSession(result.session);
      await proceedAfterLogin(result.newAccount);
    } catch (error: unknown) {
      setState({
        step: 'failed',
        message: `账号验证已成功，后续加载失败：${authErrorMessage(error)}`,
      });
    } finally {
      requestPending.current = false;
      setSubmitting(false);
    }
  };

  const renewWechatIdentity = async () => {
    if (state.step !== 'choose' || requestPending.current) return;
    requestPending.current = true;
    setSubmitting(true);
    try {
      const code = await wxLoginCode();
      const result = await api.wechatExchange(code);
      if (result.status === 'authenticated' && result.session) {
        setPassword('');
        setState({ step: 'starting' });
        try {
          await loginWithSession(result.session);
          await proceedAfterLogin(false);
        } catch (error: unknown) {
          setState({
            step: 'failed',
            message: `账号验证已成功，后续加载失败：${authErrorMessage(error)}`,
          });
        }
        return;
      }
      if (!result.credentialToken) throw new Error('微信登录返回了无法识别的结果');
      setState({ step: 'choose', credentialToken: result.credentialToken });
      setRenewCredential(false);
      setFormError('');
    } catch (error: unknown) {
      setFormError(authErrorMessage(error));
    } finally {
      requestPending.current = false;
      setSubmitting(false);
    }
  };

  const clearInputError = () => {
    if (!renewCredential) setFormError('');
  };

  const resolveImportChoice = async (shouldImport: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (shouldImport) {
        await importGuestProgress();
        // 导入绕过数据源直接写服务器，账号快照还停留在导入前，刷新后再进入页面。
        await refreshRuntimeAsync();
      }
      await finish();
    } catch (error: unknown) {
      setState({ step: 'failed', message: authErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const resolveTicket = async (approve: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (approve) {
        await api.confirmWebLoginTicket(ticket);
        setState({ step: 'done', message: '已确认登录，网页端将自动进入。' });
      } else {
        await api.rejectWebLoginTicket(ticket);
        setState({ step: 'done', message: '已拒绝该登录请求。' });
      }
    } catch (error: unknown) {
      setState({ step: 'failed', message: authErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      {state.step === 'starting' && <View className="notice">正在登录微信…</View>}

      {state.step === 'choose' && (
        <View className="card">
          <View className="name">{bindMode ? '绑定已有账号' : '创建新账号'}</View>
          <View className="label">用户名</View>
          <Input
            className="input"
            type="nickname"
            value={username}
            disabled={submitting}
            maxlength={32}
            placeholder="2–32 位汉字、字母、数字、下划线或连字符"
            onInput={(event) => {
              setUsername(event.detail.value);
              clearInputError();
            }}
          />
          {bindMode && (
            <PasswordInput
              label="密码"
              value={password}
              disabled={submitting}
              error={formError}
              placeholder="账号密码"
              onChange={(value) => {
                setPassword(value);
                clearInputError();
              }}
            />
          )}
          {!bindMode && formError && <View className="error">{formError}</View>}
          <Button
            className="primary"
            loading={submitting}
            disabled={submitting}
            onClick={() => void (renewCredential ? renewWechatIdentity() : submit())}
          >
            {renewCredential ? '重新验证微信' : bindMode ? '验证密码并绑定' : '创建账号'}
          </Button>
          <Button
            className="secondary"
            disabled={submitting}
            onClick={() => {
              clearInputError();
              setBindMode((current) => !current);
            }}
          >
            {bindMode ? '没有账号，创建新账号' : '已有账号，去绑定'}
          </Button>
        </View>
      )}

      {state.step === 'import-choice' && (
        <View className="card">
          <View className="name">导入本机游客进度？</View>
          <View className="paragraph">
            本机存在游客阵容或战报。导入后数据归属当前账号，本机游客存档将清空。
          </View>
          <Button
            className="primary"
            loading={submitting}
            disabled={submitting}
            onClick={() => void resolveImportChoice(true)}
          >
            导入游客进度
          </Button>
          <Button
            className="secondary"
            disabled={submitting}
            onClick={() => void resolveImportChoice(false)}
          >
            暂不导入
          </Button>
        </View>
      )}

      {state.step === 'confirm-ticket' && (
        <View className="card">
          <View className="name">网页端登录请求</View>
          <View className="paragraph">
            My Basketball GM 网页端请求使用当前账号登录。确认后，发起请求的浏览器将获得登录状态。
          </View>
          <Button
            className="primary"
            loading={submitting}
            disabled={submitting}
            onClick={() => void resolveTicket(true)}
          >
            确认登录网页端
          </Button>
          <Button
            className="secondary"
            disabled={submitting}
            onClick={() => void resolveTicket(false)}
          >
            拒绝
          </Button>
        </View>
      )}

      {state.step === 'done' && (
        <View className="card">
          <View className="paragraph">{state.message}</View>
          <Button
            className="primary"
            onClick={() => void Taro.switchTab({ url: '/pages/account/index' })}
          >
            返回我的
          </Button>
        </View>
      )}

      {state.step === 'failed' && (
        <View className="card">
          <View className="error">{state.message}</View>
          <Button className="primary" onClick={() => void startLogin()}>
            重新登录
          </Button>
          <Button
            className="secondary"
            onClick={() => void Taro.switchTab({ url: '/pages/account/index' })}
          >
            返回我的
          </Button>
        </View>
      )}
    </View>
  );
}

export default function AuthPage() {
  // 认证流程不随数据源加载状态卸载：登录触发的数据源切换由流程自身管理。
  return (
    <PageShell title="账号登录">
      <AuthContent />
    </PageShell>
  );
}
