package db.migration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.sql.PreparedStatement;
import java.util.Map;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** 为历史公共球员补齐简体中文名称，数据与前端目录共用同一资源文件。 */
public class V13__seed_historical_player_chinese_names extends BaseJavaMigration {
  private static final String CATALOG_RESOURCE = "/player-catalog-chinese-names.json";
  private static final String UPDATE_SQL = """
      update players
      set chinese_name = ?
      where catalog_key = ? and is_custom = false
      """;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public void migrate(Context context) throws Exception {
    Map<String, String> names = readChineseNames();

    try (PreparedStatement statement = context.getConnection().prepareStatement(UPDATE_SQL)) {
      for (Map.Entry<String, String> entry : names.entrySet()) {
        statement.setString(1, entry.getValue());
        statement.setString(2, entry.getKey());
        statement.addBatch();
      }

      int[] updatedRows = statement.executeBatch();
      for (int updatedRowsForPlayer : updatedRows) {
        if (updatedRowsForPlayer != 1) {
          throw new IllegalStateException("Historical player Chinese name migration is incomplete");
        }
      }
    }
  }

  private Map<String, String> readChineseNames() throws Exception {
    try (InputStream inputStream = getClass().getResourceAsStream(CATALOG_RESOURCE)) {
      if (inputStream == null) {
        throw new IllegalStateException("Historical player Chinese name catalog is unavailable");
      }

      return objectMapper.readValue(inputStream, new TypeReference<>() {});
    }
  }
}
