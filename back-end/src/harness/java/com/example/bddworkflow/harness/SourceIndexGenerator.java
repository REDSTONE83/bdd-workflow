package com.example.bddworkflow.harness;

import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.RecordDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.ArrayInitializerExpr;
import com.github.javaparser.ast.expr.BooleanLiteralExpr;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.FieldAccessExpr;
import com.github.javaparser.ast.expr.IntegerLiteralExpr;
import com.github.javaparser.ast.expr.MemberValuePair;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.expr.NormalAnnotationExpr;
import com.github.javaparser.ast.expr.SingleMemberAnnotationExpr;
import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.github.javaparser.ast.expr.TextBlockLiteralExpr;
import com.github.javaparser.ast.nodeTypes.NodeWithAnnotations;
import com.github.javaparser.ast.type.Type;

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

    private record ApiEntry(
            List<String> requirements,
            String http,
            String controller,
            String file,
            String operationSummary,
            int operationSummaryLine,
            String operationDescription,
            int operationDescriptionLine,
            List<ResponseEntry> responses
    ) {
    }

    private record ResponseEntry(String responseCode, String description, int line) {
    }

    private record TestEntry(
            List<String> requirements,
            String className,
            String method,
            String identity,
            String displayName,
            List<String> covers,
            String file
    ) {
    }

    private record ColumnEntry(
            List<String> requirements,
            String fieldName,
            String columnName,
            String javaType,
            boolean primaryKey,
            String generation,
            Boolean nullable,
            Boolean unique,
            Integer length
    ) {
    }

    private record EntityEntry(
            List<String> requirements,
            String className,
            String table,
            List<ColumnEntry> columns,
            String file
    ) {
    }

    private record DtoField(String name, String javaType, String schemaDescription, int line) {
    }

    private record DtoEntry(
            List<String> requirements,
            String className,
            String file,
            String schemaDescription,
            int schemaLine,
            List<DtoField> fields
    ) {
    }

    private record TextChannel(
            String channel,
            String content,
            String file,
            int line,
            String source,
            List<String> requirements
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

        List<ApiEntry> apis = new ArrayList<>();
        List<EntityEntry> entities = new ArrayList<>();
        List<DtoEntry> dtos = new ArrayList<>();
        List<TextChannel> textChannels = new ArrayList<>();
        readMain(workspaceRoot, mainJavaRoot, apis, entities, dtos, textChannels);
        List<TestEntry> tests = readTests(workspaceRoot, testJavaRoot, textChannels);

        Files.createDirectories(outputFile.getParent());
        Files.writeString(outputFile, toJson(apis, tests, entities, dtos, textChannels), StandardCharsets.UTF_8);
    }

    private static void readMain(
            Path workspaceRoot,
            Path mainJavaRoot,
            List<ApiEntry> apis,
            List<EntityEntry> entities,
            List<DtoEntry> dtos,
            List<TextChannel> textChannels
    ) throws IOException {
        for (Path file : javaFiles(mainJavaRoot)) {
            CompilationUnit unit = StaticJavaParser.parse(file);
            String relativeFile = relative(workspaceRoot, file);

            for (ClassOrInterfaceDeclaration type : unit.findAll(ClassOrInterfaceDeclaration.class)) {
                String className = type.getNameAsString();
                List<String> classRequirements = requirementValues(type);

                if (hasAnnotation(type, "Entity")) {
                    entities.add(buildEntity(type, className, classRequirements, relativeFile));
                }

                String basePath = annotation(type, "RequestMapping")
                        .map(SourceIndexGenerator::annotationPath)
                        .orElse("");

                for (MethodDeclaration method : type.getMethods()) {
                    Optional<Mapping> mapping = mapping(method);
                    if (mapping.isEmpty() && annotation(method, "RequestMapping").isPresent()) {
                        throw new IllegalStateException(
                                "Method-level @RequestMapping must declare method=...: "
                                        + className + "." + method.getNameAsString()
                                        + " in " + relativeFile
                        );
                    }
                    if (mapping.isEmpty()) {
                        continue;
                    }

                    List<String> requirements = resolveRequirements(method, classRequirements);
                    if (requirements.isEmpty()) {
                        continue;
                    }

                    String controller = className + "." + method.getNameAsString();
                    String operationSummary = "";
                    int operationSummaryLine = 0;
                    String operationDescription = "";
                    int operationDescriptionLine = 0;
                    Optional<AnnotationExpr> operation = annotation(method, "Operation");
                    if (operation.isPresent()) {
                        AnnotationExpr op = operation.get();
                        Optional<Expression> summaryExpr = memberValue(op, "summary");
                        if (summaryExpr.isPresent()) {
                            operationSummary = firstString(summaryExpr.get());
                            operationSummaryLine = lineOf(summaryExpr.get());
                            if (!operationSummary.isEmpty()) {
                                textChannels.add(new TextChannel(
                                        "@Operation.summary",
                                        operationSummary,
                                        relativeFile,
                                        operationSummaryLine,
                                        controller,
                                        requirements
                                ));
                            }
                        }
                        Optional<Expression> descriptionExpr = memberValue(op, "description");
                        if (descriptionExpr.isPresent()) {
                            operationDescription = firstString(descriptionExpr.get());
                            operationDescriptionLine = lineOf(descriptionExpr.get());
                            if (!operationDescription.isEmpty()) {
                                textChannels.add(new TextChannel(
                                        "@Operation.description",
                                        operationDescription,
                                        relativeFile,
                                        operationDescriptionLine,
                                        controller,
                                        requirements
                                ));
                            }
                        }
                    }

                    List<ResponseEntry> responses = new ArrayList<>();
                    for (AnnotationExpr apiResponse : collectApiResponses(method)) {
                        String responseCode = memberValue(apiResponse, "responseCode")
                                .map(SourceIndexGenerator::firstString)
                                .orElse("");
                        Optional<Expression> descExpr = memberValue(apiResponse, "description");
                        String description = descExpr.map(SourceIndexGenerator::firstString).orElse("");
                        int line = descExpr.map(SourceIndexGenerator::lineOf).orElse(lineOf(apiResponse));
                        responses.add(new ResponseEntry(responseCode, description, line));
                        if (!description.isEmpty()) {
                            textChannels.add(new TextChannel(
                                    "@ApiResponse.description",
                                    description,
                                    relativeFile,
                                    line,
                                    controller + "#" + (responseCode.isEmpty() ? "?" : responseCode),
                                    requirements
                            ));
                        }
                    }

                    apis.add(new ApiEntry(
                            requirements,
                            mapping.get().method() + " " + joinPaths(basePath, mapping.get().path()),
                            controller,
                            relativeFile,
                            operationSummary,
                            operationSummaryLine,
                            operationDescription,
                            operationDescriptionLine,
                            responses
                    ));
                }
            }

            for (RecordDeclaration record : unit.findAll(RecordDeclaration.class)) {
                String className = record.getNameAsString();
                List<String> classRequirements = requirementValues(record);

                Optional<AnnotationExpr> classSchema = annotation(record, "Schema");
                String classSchemaDescription = "";
                int classSchemaLine = 0;
                if (classSchema.isPresent()) {
                    Optional<Expression> descExpr = memberValue(classSchema.get(), "description");
                    if (descExpr.isPresent()) {
                        classSchemaDescription = firstString(descExpr.get());
                        classSchemaLine = lineOf(descExpr.get());
                    }
                }

                List<DtoField> fields = new ArrayList<>();
                boolean anyComponentSchema = false;
                for (Parameter parameter : record.getParameters()) {
                    String parameterName = parameter.getNameAsString();
                    Type parameterType = parameter.getType();
                    String javaType = parameterType.isClassOrInterfaceType()
                            ? parameterType.asClassOrInterfaceType().getNameAsString()
                            : parameterType.asString();
                    Optional<AnnotationExpr> paramSchema = annotation(parameter, "Schema");
                    String fieldSchemaDescription = "";
                    int fieldSchemaLine = lineOf(parameter);
                    if (paramSchema.isPresent()) {
                        anyComponentSchema = true;
                        Optional<Expression> descExpr = memberValue(paramSchema.get(), "description");
                        if (descExpr.isPresent()) {
                            fieldSchemaDescription = firstString(descExpr.get());
                            fieldSchemaLine = lineOf(descExpr.get());
                        }
                    }
                    fields.add(new DtoField(parameterName, javaType, fieldSchemaDescription, fieldSchemaLine));
                }

                boolean isDto = classSchema.isPresent() || anyComponentSchema;
                if (!isDto) {
                    continue;
                }

                if (!classSchemaDescription.isEmpty()) {
                    textChannels.add(new TextChannel(
                            "@Schema.description",
                            classSchemaDescription,
                            relativeFile,
                            classSchemaLine,
                            className,
                            classRequirements
                    ));
                }
                for (DtoField field : fields) {
                    if (!field.schemaDescription().isEmpty()) {
                        textChannels.add(new TextChannel(
                                "@Schema.description",
                                field.schemaDescription(),
                                relativeFile,
                                field.line(),
                                className + "." + field.name(),
                                classRequirements
                        ));
                    }
                }

                dtos.add(new DtoEntry(
                        classRequirements,
                        className,
                        relativeFile,
                        classSchemaDescription,
                        classSchemaLine,
                        fields
                ));
            }
        }
    }

    private static EntityEntry buildEntity(
            ClassOrInterfaceDeclaration type,
            String className,
            List<String> classRequirements,
            String file
    ) {
        String table = annotation(type, "Table")
                .flatMap(annotation -> memberValue(annotation, "name")
                        .or(() -> memberValue(annotation, "value")))
                .map(SourceIndexGenerator::stringValues)
                .flatMap(values -> values.stream().findFirst())
                .filter(value -> !value.isBlank())
                .orElse(toSnakeCase(className));

        List<ColumnEntry> columns = new ArrayList<>();
        for (FieldDeclaration field : type.getFields()) {
            if (field.isStatic()) {
                continue;
            }
            if (hasAnnotation(field, "Transient")) {
                continue;
            }

            List<String> fieldRequirements = resolveRequirements(field, classRequirements);
            boolean primaryKey = hasAnnotation(field, "Id");
            Optional<AnnotationExpr> column = annotation(field, "Column");
            Boolean nullable = column.flatMap(c -> booleanMember(c, "nullable")).orElse(null);
            Boolean unique = column.flatMap(c -> booleanMember(c, "unique")).orElse(null);
            Integer length = column.flatMap(c -> integerMember(c, "length")).orElse(null);
            String generation = annotation(field, "GeneratedValue")
                    .map(annotation -> memberValue(annotation, "strategy")
                            .flatMap(expression -> methodNames(expression).stream().findFirst())
                            .orElse("AUTO"))
                    .orElse(null);

            for (VariableDeclarator variable : field.getVariables()) {
                String fieldName = variable.getNameAsString();
                String columnName = column
                        .flatMap(c -> memberValue(c, "name"))
                        .map(SourceIndexGenerator::stringValues)
                        .flatMap(values -> values.stream().findFirst())
                        .filter(value -> !value.isBlank())
                        .orElse(toSnakeCase(fieldName));
                Type fieldType = variable.getType();
                String javaType = fieldType.isClassOrInterfaceType()
                        ? fieldType.asClassOrInterfaceType().getNameAsString()
                        : fieldType.asString();

                columns.add(new ColumnEntry(
                        fieldRequirements,
                        fieldName,
                        columnName,
                        javaType,
                        primaryKey,
                        generation,
                        nullable,
                        unique,
                        length
                ));
            }
        }

        return new EntityEntry(classRequirements, className, table, columns, file);
    }

    private static List<TestEntry> readTests(
            Path workspaceRoot,
            Path testJavaRoot,
            List<TextChannel> textChannels
    ) throws IOException {
        List<TestEntry> tests = new ArrayList<>();
        for (Path file : javaFiles(testJavaRoot)) {
            CompilationUnit unit = StaticJavaParser.parse(file);
            String relativeFile = relative(workspaceRoot, file);
            for (ClassOrInterfaceDeclaration type : unit.findAll(ClassOrInterfaceDeclaration.class)) {
                String className = type.getNameAsString();
                List<String> classRequirements = requirementValues(type);

                for (MethodDeclaration method : type.getMethods()) {
                    List<String> requirements = resolveRequirements(method, classRequirements);
                    if (requirements.isEmpty()) {
                        continue;
                    }

                    List<String> covers = new ArrayList<>();
                    Optional<AnnotationExpr> coversAnnotation = annotation(method, "Covers");
                    coversAnnotation
                            .map(SourceIndexGenerator::stringValues)
                            .ifPresent(covers::addAll);

                    Optional<AnnotationExpr> displayAnnotation = annotation(method, "DisplayName");
                    String displayName = displayAnnotation
                            .map(SourceIndexGenerator::stringValues)
                            .flatMap(values -> values.stream().findFirst())
                            .orElse("");
                    if (covers.isEmpty() && displayName.isBlank()) {
                        continue;
                    }

                    String methodName = method.getNameAsString();
                    String identity = className + "." + methodName;
                    tests.add(new TestEntry(
                            requirements,
                            className,
                            methodName,
                            identity,
                            displayName,
                            covers,
                            relativeFile
                    ));

                    if (coversAnnotation.isPresent()) {
                        int coversLine = lineOf(coversAnnotation.get());
                        for (String coversValue : covers) {
                            textChannels.add(new TextChannel(
                                    "@Covers",
                                    coversValue,
                                    relativeFile,
                                    coversLine,
                                    identity,
                                    requirements
                            ));
                        }
                    }
                    if (displayAnnotation.isPresent() && !displayName.isBlank()) {
                        textChannels.add(new TextChannel(
                                "@DisplayName",
                                displayName,
                                relativeFile,
                                lineOf(displayAnnotation.get()),
                                identity,
                                requirements
                        ));
                    }
                }
            }
        }
        return tests;
    }

    private static List<AnnotationExpr> collectApiResponses(MethodDeclaration method) {
        List<AnnotationExpr> responses = new ArrayList<>();
        annotation(method, "ApiResponses").ifPresent(wrapper -> {
            Expression value = null;
            if (wrapper instanceof SingleMemberAnnotationExpr single) {
                value = single.getMemberValue();
            } else if (wrapper instanceof NormalAnnotationExpr normal) {
                value = normal.getPairs().stream()
                        .filter(pair -> pair.getNameAsString().equals("value"))
                        .map(MemberValuePair::getValue)
                        .findFirst()
                        .orElse(null);
            }
            if (value instanceof ArrayInitializerExpr array) {
                for (Expression element : array.getValues()) {
                    if (element instanceof AnnotationExpr annotation) {
                        responses.add(annotation);
                    }
                }
            } else if (value instanceof AnnotationExpr annotation) {
                responses.add(annotation);
            }
        });
        annotation(method, "ApiResponse").ifPresent(responses::add);
        return responses;
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

    private static boolean hasAnnotation(NodeWithAnnotations<?> node, String name) {
        return annotation(node, name).isPresent();
    }

    private static List<String> requirementValues(NodeWithAnnotations<?> node) {
        return annotation(node, "Requirement")
                .map(SourceIndexGenerator::stringValues)
                .orElseGet(List::of);
    }

    private static List<String> resolveRequirements(NodeWithAnnotations<?> node, List<String> fallback) {
        List<String> own = requirementValues(node);
        return own.isEmpty() ? fallback : own;
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

    private static Optional<Boolean> booleanMember(AnnotationExpr annotation, String memberName) {
        return memberValue(annotation, memberName)
                .filter(Expression::isBooleanLiteralExpr)
                .map(expression -> ((BooleanLiteralExpr) expression).getValue());
    }

    private static Optional<Integer> integerMember(AnnotationExpr annotation, String memberName) {
        return memberValue(annotation, memberName)
                .filter(Expression::isIntegerLiteralExpr)
                .map(expression -> ((IntegerLiteralExpr) expression).asNumber().intValue());
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

        if (expression instanceof TextBlockLiteralExpr textBlock) {
            return List.of(textBlock.asString());
        }

        if (expression instanceof ArrayInitializerExpr arrayInitializer) {
            return arrayInitializer.getValues().stream()
                    .flatMap(value -> stringValues(value).stream())
                    .toList();
        }

        return List.of();
    }

    private static String firstString(Expression expression) {
        List<String> values = stringValues(expression);
        return values.isEmpty() ? "" : values.get(0);
    }

    private static int lineOf(Node node) {
        return node.getRange().map(range -> range.begin.line).orElse(0);
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

    private static String toSnakeCase(String value) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            if (Character.isUpperCase(current)) {
                if (i > 0) {
                    builder.append('_');
                }
                builder.append(Character.toLowerCase(current));
            } else {
                builder.append(current);
            }
        }
        return builder.toString();
    }

    private static String toJson(
            List<ApiEntry> apis,
            List<TestEntry> tests,
            List<EntityEntry> entities,
            List<DtoEntry> dtos,
            List<TextChannel> textChannels
    ) {
        StringBuilder builder = new StringBuilder();
        builder.append("{\n");
        appendApis(builder, apis);
        builder.append(",\n");
        appendTests(builder, tests);
        builder.append(",\n");
        appendEntities(builder, entities);
        builder.append(",\n");
        appendDtos(builder, dtos);
        builder.append(",\n");
        appendTextChannels(builder, textChannels);
        builder.append("\n}\n");
        return builder.toString();
    }

    private static void appendApis(StringBuilder builder, List<ApiEntry> apis) {
        builder.append("  \"apis\": [\n");
        for (int i = 0; i < apis.size(); i++) {
            ApiEntry api = apis.get(i);
            builder.append("    {\n");
            builder.append("      \"requirements\": ").append(jsonArray(api.requirements())).append(",\n");
            builder.append("      \"http\": ").append(json(api.http())).append(",\n");
            builder.append("      \"controller\": ").append(json(api.controller())).append(",\n");
            builder.append("      \"file\": ").append(json(api.file())).append(",\n");
            builder.append("      \"operationSummary\": ").append(json(api.operationSummary())).append(",\n");
            builder.append("      \"operationSummaryLine\": ").append(api.operationSummaryLine()).append(",\n");
            builder.append("      \"operationDescription\": ").append(json(api.operationDescription())).append(",\n");
            builder.append("      \"operationDescriptionLine\": ").append(api.operationDescriptionLine()).append(",\n");
            builder.append("      \"responses\": [\n");
            List<ResponseEntry> responses = api.responses();
            for (int j = 0; j < responses.size(); j++) {
                ResponseEntry response = responses.get(j);
                builder.append("        {\n");
                builder.append("          \"responseCode\": ").append(json(response.responseCode())).append(",\n");
                builder.append("          \"description\": ").append(json(response.description())).append(",\n");
                builder.append("          \"line\": ").append(response.line()).append("\n");
                builder.append("        }");
                builder.append(j + 1 < responses.size() ? "," : "").append("\n");
            }
            builder.append("      ]\n");
            builder.append("    }");
            builder.append(i + 1 < apis.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
    }

    private static void appendTests(StringBuilder builder, List<TestEntry> tests) {
        builder.append("  \"tests\": [\n");
        for (int i = 0; i < tests.size(); i++) {
            TestEntry test = tests.get(i);
            builder.append("    {\n");
            builder.append("      \"requirements\": ").append(jsonArray(test.requirements())).append(",\n");
            builder.append("      \"className\": ").append(json(test.className())).append(",\n");
            builder.append("      \"method\": ").append(json(test.method())).append(",\n");
            builder.append("      \"identity\": ").append(json(test.identity())).append(",\n");
            builder.append("      \"displayName\": ").append(json(test.displayName())).append(",\n");
            builder.append("      \"covers\": ").append(jsonArray(test.covers())).append(",\n");
            builder.append("      \"file\": ").append(json(test.file())).append("\n");
            builder.append("    }");
            builder.append(i + 1 < tests.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
    }

    private static void appendEntities(StringBuilder builder, List<EntityEntry> entities) {
        builder.append("  \"entities\": [\n");
        for (int i = 0; i < entities.size(); i++) {
            EntityEntry entity = entities.get(i);
            builder.append("    {\n");
            builder.append("      \"requirements\": ").append(jsonArray(entity.requirements())).append(",\n");
            builder.append("      \"className\": ").append(json(entity.className())).append(",\n");
            builder.append("      \"table\": ").append(json(entity.table())).append(",\n");
            builder.append("      \"file\": ").append(json(entity.file())).append(",\n");
            builder.append("      \"columns\": [\n");
            List<ColumnEntry> columns = entity.columns();
            for (int j = 0; j < columns.size(); j++) {
                ColumnEntry column = columns.get(j);
                builder.append("        {\n");
                builder.append("          \"requirements\": ").append(jsonArray(column.requirements())).append(",\n");
                builder.append("          \"fieldName\": ").append(json(column.fieldName())).append(",\n");
                builder.append("          \"columnName\": ").append(json(column.columnName())).append(",\n");
                builder.append("          \"javaType\": ").append(json(column.javaType())).append(",\n");
                builder.append("          \"primaryKey\": ").append(column.primaryKey()).append(",\n");
                builder.append("          \"generation\": ").append(column.generation() == null ? "null" : json(column.generation())).append(",\n");
                builder.append("          \"nullable\": ").append(column.nullable() == null ? "null" : column.nullable()).append(",\n");
                builder.append("          \"unique\": ").append(column.unique() == null ? "null" : column.unique()).append(",\n");
                builder.append("          \"length\": ").append(column.length() == null ? "null" : column.length()).append("\n");
                builder.append("        }");
                builder.append(j + 1 < columns.size() ? "," : "").append("\n");
            }
            builder.append("      ]\n");
            builder.append("    }");
            builder.append(i + 1 < entities.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
    }

    private static void appendDtos(StringBuilder builder, List<DtoEntry> dtos) {
        builder.append("  \"dtos\": [\n");
        for (int i = 0; i < dtos.size(); i++) {
            DtoEntry dto = dtos.get(i);
            builder.append("    {\n");
            builder.append("      \"requirements\": ").append(jsonArray(dto.requirements())).append(",\n");
            builder.append("      \"className\": ").append(json(dto.className())).append(",\n");
            builder.append("      \"file\": ").append(json(dto.file())).append(",\n");
            builder.append("      \"schemaDescription\": ").append(json(dto.schemaDescription())).append(",\n");
            builder.append("      \"schemaLine\": ").append(dto.schemaLine()).append(",\n");
            builder.append("      \"fields\": [\n");
            List<DtoField> fields = dto.fields();
            for (int j = 0; j < fields.size(); j++) {
                DtoField field = fields.get(j);
                builder.append("        {\n");
                builder.append("          \"name\": ").append(json(field.name())).append(",\n");
                builder.append("          \"javaType\": ").append(json(field.javaType())).append(",\n");
                builder.append("          \"schemaDescription\": ").append(json(field.schemaDescription())).append(",\n");
                builder.append("          \"line\": ").append(field.line()).append("\n");
                builder.append("        }");
                builder.append(j + 1 < fields.size() ? "," : "").append("\n");
            }
            builder.append("      ]\n");
            builder.append("    }");
            builder.append(i + 1 < dtos.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
    }

    private static void appendTextChannels(StringBuilder builder, List<TextChannel> textChannels) {
        builder.append("  \"textChannels\": [\n");
        for (int i = 0; i < textChannels.size(); i++) {
            TextChannel channel = textChannels.get(i);
            builder.append("    {\n");
            builder.append("      \"channel\": ").append(json(channel.channel())).append(",\n");
            builder.append("      \"content\": ").append(json(channel.content())).append(",\n");
            builder.append("      \"file\": ").append(json(channel.file())).append(",\n");
            builder.append("      \"line\": ").append(channel.line()).append(",\n");
            builder.append("      \"source\": ").append(json(channel.source())).append(",\n");
            builder.append("      \"requirements\": ").append(jsonArray(channel.requirements())).append("\n");
            builder.append("    }");
            builder.append(i + 1 < textChannels.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
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
