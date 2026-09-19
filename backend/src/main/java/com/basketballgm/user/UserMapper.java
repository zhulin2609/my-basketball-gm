package com.basketballgm.user;

import java.util.UUID;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper {

  @Select("""
      select id, username, display_name as "displayName", password_hash as "passwordHash"
      from users
      where lower(username) = lower(#{username})
      """)
  UserRow findByUsername(@Param("username") String username);

  @Select("""
      select id, username, display_name as "displayName", password_hash as "passwordHash"
      from users
      where id = #{id}
      """)
  UserRow findById(@Param("id") UUID id);

  @Select("""
      insert into users (username, password_hash, display_name)
      values (#{username}, #{passwordHash}, #{displayName})
      returning id, username, display_name as "displayName", password_hash as "passwordHash"
      """)
  UserRow insertRegistered(
      @Param("username") String username,
      @Param("passwordHash") String passwordHash,
      @Param("displayName") String displayName
  );

  @Insert("""
      insert into users (id, email, display_name, username, password_hash)
      values (#{id}, #{email}, #{displayName}, #{username}, #{passwordHash})
      on conflict (id) do update
      set email = excluded.email,
          display_name = excluded.display_name,
          username = excluded.username,
          password_hash = excluded.password_hash
      """)
  void upsertLocalUser(
      @Param("id") UUID id,
      @Param("email") String email,
      @Param("displayName") String displayName,
      @Param("username") String username,
      @Param("passwordHash") String passwordHash
  );
}
