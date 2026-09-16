package com.links.basketballgm.simulation;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Public simulation choices; an omitted mode stays local for cost and reliability safety. */
public enum SimulationMode {
  LOCAL("local"),
  AI("ai");

  private final String value;

  SimulationMode(String value) {
    this.value = value;
  }

  @JsonCreator
  public static SimulationMode fromValue(String value) {
    if (value == null) return null;
    for (SimulationMode mode : values()) {
      if (mode.value.equalsIgnoreCase(value)) return mode;
    }
    throw new IllegalArgumentException("simulationMode 只能是 local 或 ai。");
  }

  static SimulationMode resolve(SimulationMode requested) {
    return requested == null ? LOCAL : requested;
  }

  @JsonValue
  public String value() {
    return value;
  }
}
