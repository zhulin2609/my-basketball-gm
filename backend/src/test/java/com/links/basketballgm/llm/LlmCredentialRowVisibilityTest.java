package com.links.basketballgm.llm;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Modifier;
import org.junit.jupiter.api.Test;

class LlmCredentialRowVisibilityTest {

  @Test
  void isPublicBecauseMyBatisReturnsItThroughAGeneratedProxy() {
    assertTrue(
        Modifier.isPublic(LlmCredentialRow.class.getModifiers()),
        "MyBatis Mapper 的公开方法返回值必须对 JDK 代理可见。"
    );
  }
}
