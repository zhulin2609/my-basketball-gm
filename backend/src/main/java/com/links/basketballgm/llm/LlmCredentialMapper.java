package com.links.basketballgm.llm;

import java.util.UUID;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface LlmCredentialMapper {
  @Select("""
      select base_url as "baseUrl", model, api_key_ciphertext as "apiKeyCiphertext",
             api_key_iv as "apiKeyIv", api_key_hint as "apiKeyHint"
      from user_llm_credentials where user_id = #{ownerId}
      """)
  LlmCredentialRow find(@Param("ownerId") UUID ownerId);

  @Insert("""
      insert into user_llm_credentials (
        user_id, base_url, model, api_key_ciphertext, api_key_iv, api_key_hint, key_version
      ) values (
        #{ownerId}, #{baseUrl}, #{model}, #{ciphertext}, #{iv}, #{apiKeyHint}, 1
      ) on conflict (user_id) do update set
        base_url = excluded.base_url, model = excluded.model,
        api_key_ciphertext = excluded.api_key_ciphertext, api_key_iv = excluded.api_key_iv,
        api_key_hint = excluded.api_key_hint, key_version = excluded.key_version, updated_at = now()
      """)
  void upsert(
      @Param("ownerId") UUID ownerId,
      @Param("baseUrl") String baseUrl,
      @Param("model") String model,
      @Param("ciphertext") byte[] ciphertext,
      @Param("iv") byte[] iv,
      @Param("apiKeyHint") String apiKeyHint
  );

  @Delete("delete from user_llm_credentials where user_id = #{ownerId}")
  int delete(@Param("ownerId") UUID ownerId);
}
