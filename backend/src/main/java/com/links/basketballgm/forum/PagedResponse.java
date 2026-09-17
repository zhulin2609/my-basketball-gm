package com.links.basketballgm.forum;

import java.util.List;

/** Shared pagination envelope for forum list endpoints. */
public record PagedResponse<T>(List<T> items, int total, int page, int pageSize) {}
