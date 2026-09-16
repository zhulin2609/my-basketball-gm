package com.links.basketballgm.user;

import java.util.UUID;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {

  @Insert("""
      insert into users (id, email, display_name)
      values (#{id}, #{email}, #{displayName})
      on conflict (id) do nothing
      """)
  void createIfAbsent(UUID id, String email, String displayName);
}
