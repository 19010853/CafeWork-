package cafework.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.Set;

/**
 * Local-only utility to compare the current PostgreSQL schema (public.*) with the expected schema in CafeWork.sql.
 *
 * Usage (PowerShell):
 *   mvn -q -DskipTests compile
 *   mvn -q -DincludeScope=runtime -Dmdep.outputFile=target/classpath.txt dependency:build-classpath
 *   $cp = Get-Content target/classpath.txt
 *   java -cp "$cp;target/classes" cafework.util.SchemaDiffMain
 */
public final class SchemaDiffMain {

    public static void main(String[] args) throws Exception {
        Path repoRoot = Path.of(System.getProperty("user.dir"));
        Path sqlPath = repoRoot.resolve("CafeWork.sql");
        Path propsPath = repoRoot.resolve("src/main/resources/application.properties");

        Map<String, Map<String, String>> expected = parseExpectedSchema(sqlPath);
        DbConfig db = loadDbConfig(propsPath);

        Map<String, Map<String, String>> actual = fetchActualSchema(db);

        printDiff(expected, actual);
    }

    private static DbConfig loadDbConfig(Path propsPath) throws IOException {
        Properties p = new Properties();
        try (InputStream in = Files.newInputStream(propsPath)) {
            p.load(in);
        }

        String url = p.getProperty("spring.datasource.url");
        String user = p.getProperty("spring.datasource.username");
        String pass = p.getProperty("spring.datasource.password");

        if (isBlank(url) || isBlank(user)) {
            throw new IllegalStateException("Missing spring.datasource.* in " + propsPath);
        }

        return new DbConfig(url.trim(), user.trim(), Objects.toString(pass, "").trim());
    }

    private static Map<String, Map<String, String>> fetchActualSchema(DbConfig db) throws Exception {
        Map<String, Map<String, String>> tables = new LinkedHashMap<>();

        try (Connection conn = DriverManager.getConnection(db.url(), db.username(), db.password());
             Statement st = conn.createStatement()) {

            // table_name, column_name, udt_name captures the underlying PG type (uuid, varchar, timestamptz, jsonb, etc.)
            String sql = "SELECT table_name, column_name, udt_name " +
                    "FROM information_schema.columns " +
                    "WHERE table_schema = 'public' " +
                    "ORDER BY table_name, ordinal_position";

            try (ResultSet rs = st.executeQuery(sql)) {
                while (rs.next()) {
                    String table = rs.getString("table_name");
                    String column = rs.getString("column_name");
                    String udtName = rs.getString("udt_name");

                    tables.computeIfAbsent(table, k -> new LinkedHashMap<>())
                            .put(column, normalizeActualType(udtName));
                }
            }
        }

        return tables;
    }

    private static String normalizeActualType(String udtName) {
        if (udtName == null) return "";
        return udtName.trim().toLowerCase(Locale.ROOT);
    }

    private static Map<String, Map<String, String>> parseExpectedSchema(Path sqlPath) throws IOException {
        Map<String, Map<String, String>> out = new LinkedHashMap<>();

        try (BufferedReader br = Files.newBufferedReader(sqlPath, StandardCharsets.UTF_8)) {
            String line;
            String currentTable = null;
            Map<String, String> currentCols = null;

            while ((line = br.readLine()) != null) {
                String trimmed = line.trim();

                if (currentTable == null) {
                    if (trimmed.toUpperCase(Locale.ROOT).startsWith("CREATE TABLE PUBLIC.")) {
                        // Example: CREATE TABLE public.search_histories (
                        int start = trimmed.indexOf("public.") + "public.".length();
                        int end = trimmed.indexOf(' ', start);
                        if (end < 0) continue;
                        currentTable = trimmed.substring(start, end).trim();
                        if (currentTable.endsWith("(")) {
                            currentTable = currentTable.substring(0, currentTable.length() - 1).trim();
                        }
                        currentCols = new LinkedHashMap<>();
                    }
                    continue;
                }

                // Inside CREATE TABLE block
                if (trimmed.startsWith(");")) {
                    out.put(currentTable, currentCols);
                    currentTable = null;
                    currentCols = null;
                    continue;
                }

                if (trimmed.isEmpty()) continue;
                if (trimmed.toUpperCase(Locale.ROOT).startsWith("CONSTRAINT ")) continue;

                // Column line pattern: name type ...,
                // Example: id uuid DEFAULT gen_random_uuid() NOT NULL,
                int space = trimmed.indexOf(' ');
                if (space <= 0) continue;

                String col = trimmed.substring(0, space).replaceAll("\"", "").trim();
                String rest = trimmed.substring(space + 1).trim();

                // Remove trailing comma
                if (rest.endsWith(",")) {
                    rest = rest.substring(0, rest.length() - 1).trim();
                }

                String expectedType = normalizeExpectedType(rest);
                if (!isBlank(col) && !isBlank(expectedType)) {
                    currentCols.put(col, expectedType);
                }
            }
        }

        return out;
    }

    private static String normalizeExpectedType(String typeAndMore) {
        String s = typeAndMore.toLowerCase(Locale.ROOT);

        // Pick the leading SQL type token(s)
        if (s.startsWith("character varying")) return "varchar";
        if (s.startsWith("timestamp with time zone")) return "timestamptz";
        if (s.startsWith("timestamp without time zone")) return "timestamp";
        if (s.startsWith("numeric")) return "numeric";
        if (s.startsWith("integer")) return "int4";
        if (s.startsWith("bigint")) return "int8";
        if (s.startsWith("boolean")) return "bool";
        if (s.startsWith("uuid")) return "uuid";
        if (s.startsWith("jsonb")) return "jsonb";
        if (s.startsWith("text")) return "text";

        // fallback: first token
        int space = s.indexOf(' ');
        String first = (space < 0 ? s : s.substring(0, space)).trim();
        return first;
    }

    private static void printDiff(Map<String, Map<String, String>> expected,
                                  Map<String, Map<String, String>> actual) {

        Set<String> expectedTables = expected.keySet();
        Set<String> actualTables = actual.keySet();

        Set<String> missingTables = new LinkedHashSet<>(expectedTables);
        missingTables.removeAll(actualTables);

        Set<String> extraTables = new LinkedHashSet<>(actualTables);
        extraTables.removeAll(expectedTables);

        System.out.println("=== Schema diff: actual DB vs CafeWork.sql ===");
        System.out.println("Expected tables: " + expectedTables.size() + ", Actual tables: " + actualTables.size());

        if (!missingTables.isEmpty()) {
            System.out.println("\nMissing tables in DB (present in SQL):");
            for (String t : missingTables) System.out.println("- " + t);
        }
        if (!extraTables.isEmpty()) {
            System.out.println("\nExtra tables in DB (not in SQL):");
            for (String t : extraTables) System.out.println("- " + t);
        }

        System.out.println("\nColumn diffs:");
        boolean anyColumnDiff = false;

        for (String table : expectedTables) {
            Map<String, String> expCols = expected.get(table);
            Map<String, String> actCols = actual.get(table);
            if (actCols == null) continue;

            Set<String> expNames = expCols.keySet();
            Set<String> actNames = actCols.keySet();

            Set<String> missingCols = new LinkedHashSet<>(expNames);
            missingCols.removeAll(actNames);

            Set<String> extraCols = new LinkedHashSet<>(actNames);
            extraCols.removeAll(expNames);

            Map<String, String> typeMismatches = new LinkedHashMap<>();
            for (String col : expNames) {
                if (!actCols.containsKey(col)) continue;
                String expType = expCols.get(col);
                String actType = actCols.get(col);
                if (!Objects.equals(expType, actType)) {
                    typeMismatches.put(col, expType + " != " + actType);
                }
            }

            if (!missingCols.isEmpty() || !extraCols.isEmpty() || !typeMismatches.isEmpty()) {
                anyColumnDiff = true;
                System.out.println("\n[" + table + "]");
                if (!missingCols.isEmpty()) {
                    System.out.println("  Missing columns:");
                    for (String c : missingCols) System.out.println("  - " + c + " (expected type " + expCols.get(c) + ")");
                }
                if (!extraCols.isEmpty()) {
                    System.out.println("  Extra columns:");
                    for (String c : extraCols) System.out.println("  - " + c + " (actual type " + actCols.get(c) + ")");
                }
                if (!typeMismatches.isEmpty()) {
                    System.out.println("  Type mismatches:");
                    for (Map.Entry<String, String> e : typeMismatches.entrySet()) {
                        System.out.println("  - " + e.getKey() + ": " + e.getValue());
                    }
                }
            }
        }

        if (!anyColumnDiff) {
            System.out.println("(No column diffs for tables defined in CafeWork.sql)");
        }

        System.out.println("\nDone.");
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private record DbConfig(String url, String username, String password) {}
}
