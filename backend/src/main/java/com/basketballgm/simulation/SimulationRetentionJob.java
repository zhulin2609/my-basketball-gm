package com.basketballgm.simulation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Physically removes expired reports at 03:00; read queries hide them immediately at expiresAt. */
@Component
public class SimulationRetentionJob {
  private static final Logger LOGGER = LoggerFactory.getLogger(SimulationRetentionJob.class);

  private final SimulationMapper mapper;

  public SimulationRetentionJob(SimulationMapper mapper) {
    this.mapper = mapper;
  }

  @Scheduled(
      cron = "${app.simulation-retention.cron:0 0 3 * * *}",
      zone = "${app.simulation-retention.zone:Asia/Shanghai}"
  )
  @Transactional
  public void deleteExpiredReports() {
    // A PostgreSQL transaction lock prevents every TKE replica from running the same cleanup.
    if (!mapper.tryCleanupLock()) return;

    int deleted = mapper.deleteExpired();
    if (deleted > 0) LOGGER.info("Deleted {} expired simulation reports", deleted);
  }
}
