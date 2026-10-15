import Taro from '@tarojs/taro';

/** 获取微信登录临时 code；结果交由后端交换身份，客户端不接触 openid。 */
export async function wxLoginCode(): Promise<string> {
  const result = await Taro.login();
  if (!result.code) {
    // errMsg 是微信侧的具体失败原因（如 login:fail 的具体描述），直接展示便于定位。
    const reason =
      typeof result.errMsg === 'string' && result.errMsg ? result.errMsg : '未返回授权码';
    throw new Error(`微信登录失败：${reason}`);
  }
  return result.code;
}
