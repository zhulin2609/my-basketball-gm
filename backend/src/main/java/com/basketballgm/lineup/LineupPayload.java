package com.basketballgm.lineup;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Browser-owned lineup shape. A draft may be incomplete while a user is assembling it,
 * but it may never contain an impossible roster state.
 */
public record LineupPayload(
    @NotBlank @Size(max = 120) String name,
    @NotNull @Size(max = 1000) String description,
    @NotNull @Size(max = 15) List<@Valid LineupMemberPayload> members
) {
  public String validationMessage() {
    if (members.size() > 15) return "阵容最多只能有 15 名球员。";

    Set<String> playerIds = new HashSet<>();
    int activeCount = 0;
    int starterCount = 0;
    for (LineupMemberPayload member : members) {
      if (!playerIds.add(member.playerId())) return "同一名球员不能重复加入阵容。";
      if (!member.inactive()) activeCount++;
      if (member.starter() && member.inactive()) return "非激活球员不能设为首发。";
      if (member.starter()) starterCount++;
    }
    if (activeCount > 13) return "最多只能有 13 名激活球员。";
    if (starterCount > 5) return "首发最多只能有 5 人。";

    return null;
  }
}
