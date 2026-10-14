package com.basketballgm.auth;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * 进程内固定窗口限频：保护会直接调用微信接口的匿名入口，在发起上游请求前拦截。
 * 计数重启后清零；持久额度仍由数据库计数承担。
 */
@Component
class AuthRateLimiter {
  private final Map<String, AtomicInteger> counters = new ConcurrentHashMap<>();

  boolean allow(String scope, int perMinute) {
    String windowKey = scope + ':' + Instant.now().getEpochSecond() / 60;
    counters.keySet().removeIf(key -> key.startsWith(scope + ':') && !key.equals(windowKey));
    return counters.computeIfAbsent(windowKey, key -> new AtomicInteger()).incrementAndGet() <= perMinute;
  }
}
