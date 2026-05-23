package com.example.bddworkflow.harness;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-006 OpenAPI 계약 산출물 생성 도구 (Layer 1 collector).
 *
 * Spring 컨텍스트를 한 번 띄워 /v3/api-docs JSON을 받아
 * build/harness/indexes/openapi.index.json 으로 정규화 형태로 저장한다.
 *
 * 정규화 형태 (data-contracts.md 인덱스 엔트리 최소 형태):
 *   entries[i] = {
 *     kind: "api-operation",
 *     requirements: [],
 *     method: "POST",
 *     path: "/users/signup",
 *     operationId: "...",
 *     location: { file: "", line: 0, identity: "POST /users/signup" }
 *   }
 *   rawOpenApi: <원본 /v3/api-docs JSON 그대로 — 후속 도구가 schema 참조용으로 사용>
 *   sha256: <rawOpenApi 직렬화 결과의 SHA-256 — FE-API-CLIENT-STALE 비교 키>
 *
 * 이 클래스는 BDD Acceptance Test가 아니라 산출물 생성용이라 @Covers / @AcceptanceTest 를 두지 않는다.
 */
@Requirement("REQ-006")
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiContractDumpTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void dumpOpenApiContractAsHarnessIndex() throws Exception {
        // 1) /v3/api-docs raw JSON 수집
        MvcResult result = mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn();
        String raw = result.getResponse().getContentAsString(StandardCharsets.UTF_8);

        ObjectMapper mapper = new ObjectMapper();
        JsonNode contract = mapper.readTree(raw);

        // 2) entries[] 정규화 — FE-API 검사기가 단일 indexes/ 파일만 보고 비교하도록
        ObjectNode payload = mapper.createObjectNode();
        payload.put("generatedAt", Instant.now().toString());
        payload.put("schemaVersion", "1");
        payload.put("source", "openapi.index");
        payload.put("sha256", sha256(mapper.writeValueAsString(canonicalize(mapper, contract))));

        ArrayNode entries = mapper.createArrayNode();
        List<ObjectNode> operationEntries = new ArrayList<>();
        JsonNode paths = contract.path("paths");
        if (paths.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> pathIt = paths.fields();
            while (pathIt.hasNext()) {
                Map.Entry<String, JsonNode> pathEntry = pathIt.next();
                String path = pathEntry.getKey();
                JsonNode methods = pathEntry.getValue();
                Iterator<Map.Entry<String, JsonNode>> methodIt = methods.fields();
                while (methodIt.hasNext()) {
                    Map.Entry<String, JsonNode> methodEntry = methodIt.next();
                    String method = methodEntry.getKey().toUpperCase();
                    JsonNode op = methodEntry.getValue();

                    ObjectNode entry = mapper.createObjectNode();
                    entry.put("kind", "api-operation");
                    entry.set("requirements", mapper.createArrayNode());
                    entry.put("method", method);
                    entry.put("path", path);
                    entry.put("operationId", op.path("operationId").asText(""));

                    ObjectNode location = mapper.createObjectNode();
                    location.put("file", "");
                    location.put("line", 0);
                    location.put("identity", method + " " + path);
                    entry.set("location", location);

                    operationEntries.add(entry);
                }
            }
        }
        operationEntries.stream()
                .sorted(Comparator
                        .comparing((ObjectNode entry) -> entry.path("path").asText())
                        .thenComparing(entry -> entry.path("method").asText()))
                .forEach(entries::add);
        payload.set("entries", entries);
        payload.set("rawOpenApi", contract);

        // 3) build/harness/indexes/openapi.index.json 저장
        Path outFile = locateOutputFile();
        Files.createDirectories(outFile.getParent());
        Files.writeString(outFile, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload) + "\n");
    }

    private static Path locateOutputFile() {
        // 테스트는 back-end/ 디렉터리에서 실행된다. workspace 루트는 그 부모.
        Path cwd = Paths.get("").toAbsolutePath();
        Path workspaceRoot = cwd.getParent();
        if (workspaceRoot == null) {
            workspaceRoot = cwd;
        }
        return workspaceRoot.resolve(Paths.get("build", "harness", "indexes", "openapi.index.json"));
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute SHA-256 for OpenAPI dump", e);
        }
    }

    private static JsonNode canonicalize(ObjectMapper mapper, JsonNode node) {
        if (node == null || node.isNull() || node.isValueNode()) {
            return node;
        }
        if (node.isArray()) {
            ArrayNode array = mapper.createArrayNode();
            for (JsonNode element : node) {
                array.add(canonicalize(mapper, element));
            }
            return array;
        }
        ObjectNode object = mapper.createObjectNode();
        List<String> names = new ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        names.sort(String::compareTo);
        for (String name : names) {
            object.set(name, canonicalize(mapper, node.get(name)));
        }
        return object;
    }
}
