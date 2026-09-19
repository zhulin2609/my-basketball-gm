package com.basketballgm.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Comment write shape; parentId marks a reply to a top-level comment of the same post. */
public record CommentRequest(
    @NotBlank @Size(max = 2000) String content,
    String parentId
) {}
