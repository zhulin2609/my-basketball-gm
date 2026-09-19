package com.basketballgm.simulation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class SimulationModeTest {
  @Test
  void defaultsToLocalWhenClientOmitsMode() {
    assertEquals(SimulationMode.LOCAL, SimulationMode.resolve(null));
    assertEquals(SimulationMode.LOCAL, SimulationMode.resolve(SimulationMode.fromValue(null)));
  }

  @Test
  void acceptsTheTwoPublicWireValues() {
    assertEquals(SimulationMode.LOCAL, SimulationMode.fromValue("local"));
    assertEquals(SimulationMode.AI, SimulationMode.fromValue("ai"));
  }

  @Test
  void rejectsUnknownModes() {
    assertThrows(IllegalArgumentException.class, () -> SimulationMode.fromValue("automatic"));
  }
}
