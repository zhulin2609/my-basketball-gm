package com.basketballgm.moderation;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;

class SensitiveWordFilterTest {
  private SensitiveWordFilter filter(String... words) throws IOException {
    String content = "# comment line\n\n" + String.join("\n", words) + "\n";
    return new SensitiveWordFilter(new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8)));
  }

  @Test
  void matchesWordInTheMiddleOfText() throws IOException {
    SensitiveWordFilter filter = filter("赌博");
    assertTrue(filter.contains("这个阵容真赌博一样"));
  }

  @Test
  void matchesLatinWordsCaseInsensitively() throws IOException {
    SensitiveWordFilter filter = filter("Casino");
    assertTrue(filter.contains("join our CASINO now"));
    assertTrue(filter.contains("casino"));
  }

  @Test
  void ignoresCommentsAndBlankLinesAndPassesCleanText() throws IOException {
    SensitiveWordFilter filter = filter("赌博");
    assertFalse(filter.contains("最佳防守阵容"));
    assertFalse(filter.contains(""));
    assertFalse(filter.contains(null));
  }

  @Test
  void matchesAnyOfSeveralWords() throws IOException {
    SensitiveWordFilter filter = filter("赌博", "刷单兼职", "传销");
    assertTrue(filter.contains("刷单兼职了解一下"));
    assertFalse(filter.contains("兼职"));
  }
}
