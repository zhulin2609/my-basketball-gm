package com.basketballgm.auth;

import java.util.List;
import java.util.UUID;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserIdentityMapper {
  @Select("""
      select id::text, user_id as "userId", provider, appid, openid, unionid,
             created_at as "createdAt"
      from user_identities
      where provider = #{provider} and appid = #{appid} and openid = #{openid}
      """)
  UserIdentityRow find(
      @Param("provider") String provider,
      @Param("appid") String appid,
      @Param("openid") String openid
  );

  @Select("""
      select id::text, user_id as "userId", provider, appid, openid, unionid,
             created_at as "createdAt"
      from user_identities
      where user_id = #{userId}
      order by created_at
      """)
  List<UserIdentityRow> listByUser(@Param("userId") UUID userId);

  @Insert("""
      insert into user_identities (user_id, provider, appid, openid, unionid)
      values (#{userId}, #{provider}, #{appid}, #{openid}, #{unionid})
      """)
  int insert(
      @Param("userId") UUID userId,
      @Param("provider") String provider,
      @Param("appid") String appid,
      @Param("openid") String openid,
      @Param("unionid") String unionid
  );
}
