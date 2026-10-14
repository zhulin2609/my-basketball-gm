package com.basketballgm.auth;

import java.time.Instant;
import java.util.UUID;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface WechatCredentialMapper {
  @Select("""
      insert into wechat_auth_credentials (token_digest, provider, appid, openid, unionid, expires_at)
      values (#{tokenDigest}, #{provider}, #{appid}, #{openid}, #{unionid}, #{expiresAt})
      returning id::text
      """)
  String insert(
      @Param("tokenDigest") String tokenDigest,
      @Param("provider") String provider,
      @Param("appid") String appid,
      @Param("openid") String openid,
      @Param("unionid") String unionid,
      @Param("expiresAt") Instant expiresAt
  );

  @Select("""
      select id::text, provider, appid, openid, unionid, failed_attempts as "failedAttempts",
             expires_at as "expiresAt", consumed_at as "consumedAt",
             consumed_by_user_id as "consumedByUserId", created_at as "createdAt"
      from wechat_auth_credentials
      where token_digest = #{tokenDigest}
      """)
  WechatCredentialRow findByDigest(@Param("tokenDigest") String tokenDigest);

  @Select("""
      select id::text, provider, appid, openid, unionid, failed_attempts as "failedAttempts",
             expires_at as "expiresAt", consumed_at as "consumedAt",
             consumed_by_user_id as "consumedByUserId", created_at as "createdAt"
      from wechat_auth_credentials
      where id = cast(#{id} as uuid)
      """)
  WechatCredentialRow findById(@Param("id") String id);

  /** 消费前取行锁：有效期与消费状态在取得锁后的实际时刻核验。 */
  @Select("""
      select id::text, provider, appid, openid, unionid, failed_attempts as "failedAttempts",
             expires_at as "expiresAt", consumed_at as "consumedAt",
             consumed_by_user_id as "consumedByUserId", created_at as "createdAt"
      from wechat_auth_credentials
      where id = cast(#{id} as uuid)
      for no key update
      """)
  WechatCredentialRow findByIdForUpdate(@Param("id") String id);

  @Select("""
      select count(*) from wechat_auth_credentials
      where provider = #{provider} and appid = #{appid} and openid = #{openid}
        and created_at > #{since}
      """)
  int countRecentForIdentity(
      @Param("provider") String provider,
      @Param("appid") String appid,
      @Param("openid") String openid,
      @Param("since") Instant since
  );

  @Select("""
      update wechat_auth_credentials set failed_attempts = failed_attempts + 1
      where id = cast(#{id} as uuid)
      returning failed_attempts
      """)
  Integer markFailed(@Param("id") String id);

  @Update("""
      update wechat_auth_credentials set consumed_at = now(), consumed_by_user_id = #{userId}
      where id = cast(#{id} as uuid) and consumed_at is null
        and expires_at > clock_timestamp()
      """)
  int consume(@Param("id") String id, @Param("userId") UUID userId);

  @Update("""
      update wechat_auth_credentials set consumed_at = now()
      where id = cast(#{id} as uuid) and consumed_at is null
      """)
  int consumeWithoutUser(@Param("id") String id);
}
