import Taro from '@tarojs/taro';

/** 获取微信登录临时 code；结果交由后端交换身份，客户端不接触 openid。 */
export async function wxLoginCode(): Promise<string> {
  const result = await Taro.login();
  if (!result.code) throw new Error('微信登录没有返回授权码');
  return result.code;
}
