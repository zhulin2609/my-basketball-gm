package com.links.basketballgm.simulation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Local authenticated-user facade; production will replace the configured owner with a principal. */
@Validated
@RestController
@Profile("local")
@RequestMapping("/api/v1/simulations")
public class SimulationController {
  private final SimulationService service;
  private final UUID ownerId;

  public SimulationController(
      SimulationService service,
      @Value("${app.local-dev-owner-id}") UUID ownerId
  ) {
    this.service = service;
    this.ownerId = ownerId;
  }

  @GetMapping
  public List<SimulationResponse> list(
      @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit
  ) {
    return service.list(ownerId, limit);
  }

  @PostMapping
  public ResponseEntity<SimulationResponse> create(@Valid @RequestBody SimulationRequest request) {
    SimulationResponse report = service.create(ownerId, request);
    return ResponseEntity.created(URI.create("/api/v1/simulations/" + report.id())).body(report);
  }
}
