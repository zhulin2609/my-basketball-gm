import { ApiError, type ApiClient, type AuthSession } from '@dream-court/client';

export interface AccountAuthInput {
  credentialToken: string;
  username: string;
  password: string;
  bindMode: boolean;
}

export type AccountAuthResult =
  | { status: 'authenticated'; session: AuthSession; newAccount: boolean }
  | { status: 'rejected'; message: string; renewCredential: boolean };

/** 仅处理认证请求；成功后的数据加载由调用者单独处理。 */
export async function authenticateWechatAccount(
  api: Pick<ApiClient, 'wechatBind' | 'wechatRegister'>,
  input: AccountAuthInput,
): Promise<AccountAuthResult> {
  try {
    if (input.bindMode) {
      const session = await api.wechatBind(input.credentialToken, input.username, input.password);
      return { status: 'authenticated', session, newAccount: false };
    }
    const result = await api.wechatRegister(input.credentialToken, input.username);
    return { status: 'authenticated', ...result };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      if (error.code === 'CREDENTIAL_ATTEMPTS_EXCEEDED') {
        return {
          status: 'rejected',
          message: '密码尝试次数已用尽，请重新验证微信身份。',
          renewCredential: true,
        };
      }
      if (error.code === 'CREDENTIAL_INVALID') {
        return {
          status: 'rejected',
          message: '微信身份确认已失效，请重新验证微信身份。',
          renewCredential: true,
        };
      }
      return {
        status: 'rejected',
        message:
          input.bindMode && error.status === 401
            ? '用户名或密码错误，请修改后重试。'
            : error.status >= 500
              ? '服务暂时不可用，请稍后重试。'
              : error.message,
        renewCredential: false,
      };
    }
    return {
      status: 'rejected',
      message: '网络请求失败，请检查网络后重试。',
      renewCredential: false,
    };
  }
}
