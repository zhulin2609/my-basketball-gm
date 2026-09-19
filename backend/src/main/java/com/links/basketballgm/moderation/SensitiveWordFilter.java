package com.links.basketballgm.moderation;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/**
 * Local first-pass word filter built as a DFA trie from a classpath word list. It runs before the
 * cloud moderation call, so obvious violations never leave the server and never cost an API call.
 * Blank lines and lines starting with # in the word list are ignored; Latin letters match
 * case-insensitively.
 */
@Component
public class SensitiveWordFilter {
  private final Node root = new Node();

  public SensitiveWordFilter(
      @Value("${app.moderation.word-list:classpath:moderation-words.txt}") Resource wordList
  ) throws IOException {
    for (String line : wordList.getContentAsString(StandardCharsets.UTF_8).split("\\R")) {
      String word = line.strip().toLowerCase(Locale.ROOT);
      if (word.isEmpty() || word.startsWith("#")) continue;
      add(word);
    }
  }

  public boolean contains(String text) {
    if (text == null || text.isEmpty()) return false;
    String normalized = text.toLowerCase(Locale.ROOT);
    for (int start = 0; start < normalized.length(); start++) {
      Node node = root;
      for (int index = start; index < normalized.length(); index++) {
        node = node.children.get(normalized.charAt(index));
        if (node == null) break;
        if (node.terminal) return true;
      }
    }
    return false;
  }

  private void add(String word) {
    Node node = root;
    for (int index = 0; index < word.length(); index++) {
      node = node.children.computeIfAbsent(word.charAt(index), key -> new Node());
    }
    node.terminal = true;
  }

  private static final class Node {
    private final Map<Character, Node> children = new HashMap<>();
    private boolean terminal;
  }
}
