package com.links.basketballgm.simulation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import com.links.basketballgm.user.CurrentUser;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Creates and reads battle reports for the authenticated user only. */
@Validated
@RestController
@RequestMapping("/api/v1/simulations")
public class SimulationController {
  private final SimulationService service;
  private final CurrentUser currentUser;

  public SimulationController(SimulationService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @GetMapping
  public List<SimulationResponse> list(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit
  ) {
    var ownerId = currentUser.id(jwt);
    return service.list(ownerId, limit);
  }

  @PostMapping
  public ResponseEntity<SimulationResponse> create(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody SimulationRequest request
  ) {
    var ownerId = currentUser.id(jwt);
    SimulationResponse report = service.create(ownerId, request);
    return ResponseEntity.created(URI.create("/api/v1/simulations/" + report.id())).body(report);
  }
}
