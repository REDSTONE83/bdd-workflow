package com.example.bddworkflow.harness;

import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.ArrayInitializerExpr;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.FieldAccessExpr;
import com.github.javaparser.ast.expr.MemberValuePair;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.expr.NormalAnnotationExpr;
import com.github.javaparser.ast.expr.SingleMemberAnnotationExpr;
import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.github.javaparser.ast.nodeTypes.NodeWithAnnotations;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

public class SourceIndexGenerator {

    private record ApiEntry(String requirement, String http, String controller, String file) {
    }

    private record TestEntry(
            String requirement,
            String className,
            String method,
            String identity,
            String displayName,
            List<String> covers,
            String file
    ) {
    }

    private record Mapping(String method, String path) {
    }

    public static void main(String[] args) throws IOException {
        if (args.length != 4) {
            throw new IllegalArgumentException(
                    "Usage: SourceIndexGenerator <workspaceRoot> <mainJavaRoot> <testJavaRoot> <outputFile>"
            );
        }

        Path workspaceRoot = Path.of(args[0]);
        Path mainJavaRoot = Path.of(args[1]);
        Path testJavaRoot = Path.of(args[2]);
        Path outputFile = Path.of(args[3]);

        StaticJavaParser.getParserConfiguration().setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_17);

        List<ApiEntry> apis = readApis(workspaceRoot, mainJavaRoot);
        List<TestEntry> tests = readTests(workspaceRoot, testJavaRoot);

        Files.createDirectories(outputFile.getParent());
        Files.writeString(outputFile, toJson(apis, tests), StandardCharsets.UTF_8);
    }

    private static List<ApiEntry> readApis(Path workspaceRoot, Path mainJavaRoot) throws IOException {
        List<ApiEntry> apis = new ArrayList<>();
        for (Path file : javaFiles(mainJavaRoot)) {
            CompilationUnit unit = StaticJavaParser.parse(file);
            for (ClassOrInterfaceDeclaration type : unit.findAll(ClassOrInterfaceDeclaration.class)) {
                String className = type.getNameAsString();
                String classRequirement = annotationString(type, "Requirement").orElse("");
                String basePath = annotation(type, "RequestMapping")
                        .map(SourceIndexGenerator::annotationPath)
                        .orElse("");

                for (MethodDeclaration method : type.getMethods()) {
                    Optional<Mapping> mapping = mapping(method);
                    if (mapping.isEmpty() && annotation(method, "RequestMapping").isPresent()) {
                        throw new IllegalStateException(
                                "Method-level @RequestMapping must declare method=...: "
                                        + className + "." + method.getNameAsString()
                                        + " in " + relative(workspaceRoot, file)
                        );
                    }
                    if (mapping.isEmpty()) {
                        continue;
                    }

                    String requirement = annotationString(method, "Requirement").orElse(classRequirement);
                    if (requirement.isBlank()) {
                        continue;
                    }

                    apis.add(new ApiEntry(
                            requirement,
                            mapping.get().method() + " " + joinPaths(basePath, mapping.get().path()),
                            className + "." + method.getNameAsString(),
                            relative(workspaceRoot, file)
                    ));
                }
            }
        }
        return apis;
    }

    private static List<TestEntry> readTests(Path workspaceRoot, Path testJavaRoot) throws IOException {
        List<TestEntry> tests = new ArrayList<>();
        for (Path file : javaFiles(testJavaRoot)) {
            CompilationUnit unit = StaticJavaParser.parse(file);
            for (ClassOrInterfaceDeclaration type : unit.findAll(ClassOrInterfaceDeclaration.class)) {
                String className = type.getNameAsString();
                String classRequirement = annotationString(type, "Requirement").orElse("");

                for (MethodDeclaration method : type.getMethods()) {
                    String requirement = annotationString(method, "Requirement").orElse(classRequirement);
                    if (requirement.isBlank()) {
                        continue;
                    }

                    List<String> covers = new ArrayList<>();
                    annotation(method, "Covers")
                            .map(SourceIndexGenerator::stringValues)
                            .ifPresent(covers::addAll);

                    String displayName = annotationString(method, "DisplayName").orElse("");
                    if (covers.isEmpty() && displayName.isBlank()) {
                        continue;
                    }

                    String methodName = method.getNameAsString();
                    tests.add(new TestEntry(
                            requirement,
                            className,
                            methodName,
                            className + "." + methodName,
                            displayName,
                            covers,
                            relative(workspaceRoot, file)
                    ));
                }
            }
        }
        return tests;
    }

    private static List<Path> javaFiles(Path root) throws IOException {
        if (!Files.exists(root)) {
            return List.of();
        }

        try (Stream<Path> stream = Files.walk(root)) {
            return stream
                    .filter(path -> path.toString().endsWith(".java"))
                    .sorted(Comparator.comparing(Path::toString))
                    .toList();
        }
    }

    private static Optional<AnnotationExpr> annotation(NodeWithAnnotations<?> node, String name) {
        return node.getAnnotations().stream()
                .filter(annotation -> annotation.getName().getIdentifier().equals(name))
                .findFirst();
    }

    private static Optional<String> annotationString(NodeWithAnnotations<?> node, String name) {
        return annotation(node, name)
                .flatMap(annotation -> stringValues(annotation).stream().findFirst());
    }

    private static Optional<Mapping> mapping(MethodDeclaration method) {
        for (AnnotationExpr annotation : method.getAnnotations()) {
            String name = annotation.getName().getIdentifier();
            String path = annotationPath(annotation);

            switch (name) {
                case "GetMapping" -> {
                    return Optional.of(new Mapping("GET", path));
                }
                case "PostMapping" -> {
                    return Optional.of(new Mapping("POST", path));
                }
                case "PutMapping" -> {
                    return Optional.of(new Mapping("PUT", path));
                }
                case "PatchMapping" -> {
                    return Optional.of(new Mapping("PATCH", path));
                }
                case "DeleteMapping" -> {
                    return Optional.of(new Mapping("DELETE", path));
                }
                case "RequestMapping" -> {
                    return requestMappingMethod(annotation).map(httpMethod -> new Mapping(httpMethod, path));
                }
                default -> {
                }
            }
        }

        return Optional.empty();
    }

    private static Optional<String> requestMappingMethod(AnnotationExpr annotation) {
        return memberValue(annotation, "method")
                .flatMap(expression -> methodNames(expression).stream().findFirst());
    }

    private static List<String> methodNames(Expression expression) {
        if (expression.isArrayInitializerExpr()) {
            return expression.asArrayInitializerExpr().getValues().stream()
                    .flatMap(value -> methodNames(value).stream())
                    .toList();
        }
        if (expression.isFieldAccessExpr()) {
            FieldAccessExpr fieldAccess = expression.asFieldAccessExpr();
            return List.of(fieldAccess.getNameAsString());
        }
        if (expression.isNameExpr()) {
            NameExpr name = expression.asNameExpr();
            return List.of(name.getNameAsString());
        }
        return List.of();
    }

    private static String annotationPath(AnnotationExpr annotation) {
        return memberValue(annotation, "path")
                .or(() -> memberValue(annotation, "value"))
                .map(SourceIndexGenerator::stringValues)
                .flatMap(values -> values.stream().findFirst())
                .orElse("");
    }

    private static Optional<Expression> memberValue(AnnotationExpr annotation, String memberName) {
        if (annotation instanceof SingleMemberAnnotationExpr singleMember && memberName.equals("value")) {
            return Optional.of(singleMember.getMemberValue());
        }

        if (annotation instanceof NormalAnnotationExpr normalAnnotation) {
            return normalAnnotation.getPairs().stream()
                    .filter(pair -> pair.getNameAsString().equals(memberName))
                    .map(MemberValuePair::getValue)
                    .findFirst();
        }

        return Optional.empty();
    }

    private static List<String> stringValues(AnnotationExpr annotation) {
        if (annotation instanceof SingleMemberAnnotationExpr singleMember) {
            return stringValues(singleMember.getMemberValue());
        }

        if (annotation instanceof NormalAnnotationExpr normalAnnotation) {
            return normalAnnotation.getPairs().stream()
                    .filter(pair -> pair.getNameAsString().equals("value"))
                    .findFirst()
                    .map(MemberValuePair::getValue)
                    .map(SourceIndexGenerator::stringValues)
                    .orElseGet(ArrayList::new);
        }

        return List.of();
    }

    private static List<String> stringValues(Expression expression) {
        if (expression instanceof StringLiteralExpr stringLiteral) {
            return List.of(stringLiteral.getValue());
        }

        if (expression instanceof ArrayInitializerExpr arrayInitializer) {
            return arrayInitializer.getValues().stream()
                    .flatMap(value -> stringValues(value).stream())
                    .toList();
        }

        return List.of();
    }

    private static String joinPaths(String left, String right) {
        String normalizedLeft = trimSlashes(left);
        String normalizedRight = trimSlashes(right);
        if (normalizedLeft.isBlank() && normalizedRight.isBlank()) {
            return "";
        }
        if (normalizedLeft.isBlank()) {
            return "/" + normalizedRight;
        }
        if (normalizedRight.isBlank()) {
            return "/" + normalizedLeft;
        }
        return "/" + normalizedLeft + "/" + normalizedRight;
    }

    private static String trimSlashes(String value) {
        return value == null ? "" : value.replaceAll("^/+|/+$", "");
    }

    private static String relative(Path root, Path file) {
        return root.relativize(file).toString().replace('\\', '/');
    }

    private static String toJson(List<ApiEntry> apis, List<TestEntry> tests) {
        StringBuilder builder = new StringBuilder();
        builder.append("{\n");
        builder.append("  \"apis\": [\n");
        for (int i = 0; i < apis.size(); i++) {
            ApiEntry api = apis.get(i);
            builder.append("    {\n");
            builder.append("      \"requirement\": ").append(json(api.requirement())).append(",\n");
            builder.append("      \"http\": ").append(json(api.http())).append(",\n");
            builder.append("      \"controller\": ").append(json(api.controller())).append(",\n");
            builder.append("      \"file\": ").append(json(api.file())).append("\n");
            builder.append("    }");
            builder.append(i + 1 < apis.size() ? "," : "").append("\n");
        }
        builder.append("  ],\n");
        builder.append("  \"tests\": [\n");
        for (int i = 0; i < tests.size(); i++) {
            TestEntry test = tests.get(i);
            builder.append("    {\n");
            builder.append("      \"requirement\": ").append(json(test.requirement())).append(",\n");
            builder.append("      \"className\": ").append(json(test.className())).append(",\n");
            builder.append("      \"method\": ").append(json(test.method())).append(",\n");
            builder.append("      \"identity\": ").append(json(test.identity())).append(",\n");
            builder.append("      \"displayName\": ").append(json(test.displayName())).append(",\n");
            builder.append("      \"covers\": ").append(jsonArray(test.covers())).append(",\n");
            builder.append("      \"file\": ").append(json(test.file())).append("\n");
            builder.append("    }");
            builder.append(i + 1 < tests.size() ? "," : "").append("\n");
        }
        builder.append("  ]\n");
        builder.append("}\n");
        return builder.toString();
    }

    private static String jsonArray(List<String> values) {
        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            builder.append(json(values.get(i)));
            if (i + 1 < values.size()) {
                builder.append(", ");
            }
        }
        builder.append("]");
        return builder.toString();
    }

    private static String json(String value) {
        StringBuilder builder = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            switch (current) {
                case '"' -> builder.append("\\\"");
                case '\\' -> builder.append("\\\\");
                case '\b' -> builder.append("\\b");
                case '\f' -> builder.append("\\f");
                case '\n' -> builder.append("\\n");
                case '\r' -> builder.append("\\r");
                case '\t' -> builder.append("\\t");
                default -> {
                    if (current < 0x20) {
                        builder.append(String.format("\\u%04x", (int) current));
                    } else {
                        builder.append(current);
                    }
                }
            }
        }
        builder.append("\"");
        return builder.toString();
    }
}
