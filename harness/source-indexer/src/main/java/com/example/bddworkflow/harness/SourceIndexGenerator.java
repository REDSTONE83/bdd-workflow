package com.example.bddworkflow.harness;

import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
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
            List<ResponseEntry> responses,
            List<ParameterEntry> parameters,
            String returnType,
            int line
    ) {
    }

    private record ResponseEntry(String responseCode, String description, int line) {
    }

    private record ParameterEntry(
            String name,
            String javaType,
            List<String> annotations,
            String requestHeaderName,
            boolean springRequestBody
    ) {
    }

    private record TestEntry(
            List<String> requirements,
            String className,
            String method,
            String identity,
            String displayName,
            List<String> covers,
            String scope,
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
            Boolean updatable,
            Integer length,
            List<String> annotations
    ) {
    }

    private record EntityEntry(
            List<String> requirements,
            String className,
            String table,
            List<ColumnEntry> columns,
            String file,
            List<String> listeners
    ) {
    }

    private record DtoField(
            String name,
            String javaType,
            String schemaDescription,
            int line,
            String initializer,
            List<String> annotations
    ) {
    }

    private record DtoEntry(
            List<String> requirements,
            String className,
            String file,
            String schemaDescription,
            int schemaLine,
            List<DtoField> fields,
            String kind
    ) {
    }

    private record RepositoryEntry(
            List<String> requirements,
            String className,
            String file,
            String targetEntity,
            List<RepoMethodEntry> methods
    ) {
    }

    private record RepoMethodEntry(
            String name,
            String returnType,
            List<String> parameterTypes
    ) {
    }

    private record ServiceEntry(
            List<String> requirements,
            String className,
            String file,
            boolean classTransactional,
            Boolean classTransactionalReadOnly,
            List<ServiceMethodEntry> methods,
            List<ServiceFieldEntry> fields
    ) {
    }

    private record ServiceFieldEntry(String name, String type) {
    }

    private record BeanEntry(
            String containerClass,
            String methodName,
            String returnType,
            String body,
            String file
    ) {
    }

    private record ServiceMethodEntry(
            String name,
            boolean isPublic,
            boolean hasMethodTransactional,
            Boolean methodTransactionalReadOnly,
            String returnType,
            List<String> parameterTypes
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
        if (args.length < 4) {
            throw new IllegalArgumentException(
                    "Usage: SourceIndexGenerator <workspaceRoot> <mainJavaRoot> <testJavaRoot>... <outputFile>"
            );
        }

        Path workspaceRoot = Path.of(args[0]);
        Path mainJavaRoot = Path.of(args[1]);
        Path outputFile = Path.of(args[args.length - 1]);
        List<Path> testJavaRoots = new ArrayList<>();
        for (int i = 2; i < args.length - 1; i++) {
            testJavaRoots.add(Path.of(args[i]));
        }

        StaticJavaParser.getParserConfiguration().setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_17);

        List<ApiEntry> apis = new ArrayList<>();
        List<EntityEntry> entities = new ArrayList<>();
        List<DtoEntry> dtos = new ArrayList<>();
        List<RepositoryEntry> repositories = new ArrayList<>();
        List<ServiceEntry> services = new ArrayList<>();
        List<BeanEntry> beans = new ArrayList<>();
        List<TextChannel> textChannels = new ArrayList<>();
        readMain(workspaceRoot, mainJavaRoot, apis, entities, dtos, repositories, services, beans, textChannels);
        List<TestEntry> tests = new ArrayList<>();
        for (Path testJavaRoot : testJavaRoots) {
            tests.addAll(readTests(workspaceRoot, testJavaRoot, testScope(testJavaRoot), textChannels));
        }

        Files.createDirectories(outputFile.getParent());
        Files.writeString(outputFile, toJson(apis, tests, entities, dtos, repositories, services, beans, textChannels), StandardCharsets.UTF_8);
    }

    private static void readMain(
            Path workspaceRoot,
            Path mainJavaRoot,
            List<ApiEntry> apis,
            List<EntityEntry> entities,
            List<DtoEntry> dtos,
            List<RepositoryEntry> repositories,
            List<ServiceEntry> services,
            List<BeanEntry> beans,
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

                if (type.isInterface() && extendsJpaRepository(type)) {
                    repositories.add(buildRepository(type, className, classRequirements, relativeFile));
                }

                if (hasAnnotation(type, "Service")) {
                    services.add(buildService(type, className, classRequirements, relativeFile));
                }

                if (!type.isInterface() && (classHasDtoSchema(type) || isDtoPackage(relativeFile))) {
                    dtos.add(buildClassDto(type, className, classRequirements, relativeFile, textChannels));
                }

                String basePath = annotation(type, "RequestMapping")
                        .map(SourceIndexGenerator::annotationPath)
                        .orElse("");

                for (MethodDeclaration method : type.getMethods()) {
                    if (annotation(method, "Bean").isPresent()) {
                        String body = method.getBody()
                                .map(Object::toString)
                                .orElse("");
                        beans.add(new BeanEntry(
                                className,
                                method.getNameAsString(),
                                typeAsString(method.getType()),
                                body,
                                relativeFile
                        ));
                    }

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

                    List<ParameterEntry> parameters = new ArrayList<>();
                    for (Parameter parameter : method.getParameters()) {
                        List<String> annotationNames = new ArrayList<>();
                        String requestHeaderName = null;
                        boolean springRequestBody = false;
                        for (AnnotationExpr annotation : parameter.getAnnotations()) {
                            String simpleName = simpleAnnotationName(annotation);
                            annotationNames.add(simpleName);
                            if ("RequestHeader".equals(simpleName)) {
                                requestHeaderName = memberValue(annotation, "value")
                                        .or(() -> memberValue(annotation, "name"))
                                        .map(SourceIndexGenerator::firstString)
                                        .orElse(null);
                            }
                            if (isSpringRequestBody(annotation)) {
                                springRequestBody = true;
                            }
                        }
                        parameters.add(new ParameterEntry(
                                parameter.getNameAsString(),
                                typeAsString(parameter.getType()),
                                annotationNames,
                                requestHeaderName,
                                springRequestBody
                        ));
                    }
                    String returnType = typeAsString(method.getType());

                    apis.add(new ApiEntry(
                            requirements,
                            mapping.get().method() + " " + joinPaths(basePath, mapping.get().path()),
                            controller,
                            relativeFile,
                            operationSummary,
                            operationSummaryLine,
                            operationDescription,
                            operationDescriptionLine,
                            responses,
                            parameters,
                            returnType,
                            lineOf(method)
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
                    String javaType = typeAsString(parameter.getType());
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
                    List<String> annotationNames = new ArrayList<>();
                    for (AnnotationExpr annotation : parameter.getAnnotations()) {
                        annotationNames.add(simpleAnnotationName(annotation));
                    }
                    fields.add(new DtoField(
                            parameterName,
                            javaType,
                            fieldSchemaDescription,
                            fieldSchemaLine,
                            null,
                            annotationNames
                    ));
                }

                boolean isDto = classSchema.isPresent() || anyComponentSchema || isDtoPackage(relativeFile);
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
                        fields,
                        "record"
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
            Boolean updatable = column.flatMap(c -> booleanMember(c, "updatable")).orElse(null);
            Integer length = column.flatMap(c -> integerMember(c, "length")).orElse(null);
            List<String> fieldAnnotations = new ArrayList<>();
            for (AnnotationExpr annotationExpr : field.getAnnotations()) {
                fieldAnnotations.add(simpleAnnotationName(annotationExpr));
            }
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
                        updatable,
                        length,
                        fieldAnnotations
                ));
            }
        }

        List<String> listeners = new ArrayList<>();
        annotation(type, "EntityListeners").ifPresent(annotationExpr ->
                memberValue(annotationExpr, "value")
                        .ifPresent(expr -> listeners.addAll(classLiteralNames(expr)))
        );

        return new EntityEntry(classRequirements, className, table, columns, file, listeners);
    }

    private static boolean extendsJpaRepository(ClassOrInterfaceDeclaration type) {
        return type.getExtendedTypes().stream().anyMatch(t -> {
            String name = t.getNameAsString();
            return name.equals("JpaRepository")
                    || name.equals("CrudRepository")
                    || name.equals("PagingAndSortingRepository")
                    || name.equals("Repository");
        });
    }

    private static RepositoryEntry buildRepository(
            ClassOrInterfaceDeclaration type,
            String className,
            List<String> classRequirements,
            String file
    ) {
        String targetEntity = type.getExtendedTypes().stream()
                .filter(t -> {
                    String name = t.getNameAsString();
                    return name.equals("JpaRepository")
                            || name.equals("CrudRepository")
                            || name.equals("PagingAndSortingRepository")
                            || name.equals("Repository");
                })
                .findFirst()
                .flatMap(t -> t.getTypeArguments()
                        .filter(args -> !args.isEmpty())
                        .map(args -> typeAsString(args.get(0))))
                .orElse(null);

        List<RepoMethodEntry> methods = new ArrayList<>();
        for (MethodDeclaration method : type.getMethods()) {
            String returnType = typeAsString(method.getType());
            List<String> parameterTypes = new ArrayList<>();
            for (Parameter parameter : method.getParameters()) {
                parameterTypes.add(typeAsString(parameter.getType()));
            }
            methods.add(new RepoMethodEntry(method.getNameAsString(), returnType, parameterTypes));
        }
        return new RepositoryEntry(classRequirements, className, file, targetEntity, methods);
    }

    private static ServiceEntry buildService(
            ClassOrInterfaceDeclaration type,
            String className,
            List<String> classRequirements,
            String file
    ) {
        boolean classTransactional = hasAnnotation(type, "Transactional");
        Boolean classReadOnly = annotation(type, "Transactional")
                .flatMap(a -> booleanMember(a, "readOnly"))
                .orElse(null);
        List<ServiceMethodEntry> methods = new ArrayList<>();
        for (MethodDeclaration method : type.getMethods()) {
            boolean isPublic = method.isPublic();
            Optional<AnnotationExpr> tx = annotation(method, "Transactional");
            boolean hasMethodTransactional = tx.isPresent();
            Boolean methodReadOnly = tx.flatMap(a -> booleanMember(a, "readOnly")).orElse(null);
            String returnType = typeAsString(method.getType());
            List<String> parameterTypes = new ArrayList<>();
            for (Parameter parameter : method.getParameters()) {
                parameterTypes.add(typeAsString(parameter.getType()));
            }
            methods.add(new ServiceMethodEntry(
                    method.getNameAsString(),
                    isPublic,
                    hasMethodTransactional,
                    methodReadOnly,
                    returnType,
                    parameterTypes
            ));
        }
        List<ServiceFieldEntry> fields = new ArrayList<>();
        for (FieldDeclaration field : type.getFields()) {
            if (field.isStatic()) continue;
            String fieldType = typeAsString(field.getCommonType());
            for (VariableDeclarator variable : field.getVariables()) {
                fields.add(new ServiceFieldEntry(variable.getNameAsString(), fieldType));
            }
        }
        return new ServiceEntry(classRequirements, className, file, classTransactional, classReadOnly, methods, fields);
    }

    private static boolean classHasDtoSchema(ClassOrInterfaceDeclaration type) {
        if (hasAnnotation(type, "Schema")) {
            return true;
        }
        for (FieldDeclaration field : type.getFields()) {
            if (hasAnnotation(field, "Schema")) {
                return true;
            }
        }
        return false;
    }

    private static boolean isDtoPackage(String relativeFile) {
        // Per package-structure.md, DTOs live under `dto/` subpackages
        // (e.g., `category/dto/CreateCategoryRequest.java`). Index them regardless of @Schema
        // so that @RequestBody-only DTOs without OpenAPI metadata can still be validated.
        return relativeFile != null && relativeFile.contains("/dto/");
    }

    private static DtoEntry buildClassDto(
            ClassOrInterfaceDeclaration type,
            String className,
            List<String> classRequirements,
            String relativeFile,
            List<TextChannel> textChannels
    ) {
        Optional<AnnotationExpr> classSchema = annotation(type, "Schema");
        String classSchemaDescription = "";
        int classSchemaLine = 0;
        if (classSchema.isPresent()) {
            Optional<Expression> descExpr = memberValue(classSchema.get(), "description");
            if (descExpr.isPresent()) {
                classSchemaDescription = firstString(descExpr.get());
                classSchemaLine = lineOf(descExpr.get());
            }
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

        List<DtoField> fields = new ArrayList<>();
        for (FieldDeclaration field : type.getFields()) {
            if (field.isStatic()) {
                continue;
            }
            Optional<AnnotationExpr> fieldSchema = annotation(field, "Schema");
            String fieldDesc = "";
            int fieldLine = lineOf(field);
            if (fieldSchema.isPresent()) {
                Optional<Expression> descExpr = memberValue(fieldSchema.get(), "description");
                if (descExpr.isPresent()) {
                    fieldDesc = firstString(descExpr.get());
                    fieldLine = lineOf(descExpr.get());
                }
            }
            List<String> annotationNames = new ArrayList<>();
            for (AnnotationExpr annotation : field.getAnnotations()) {
                annotationNames.add(simpleAnnotationName(annotation));
            }
            for (VariableDeclarator variable : field.getVariables()) {
                String initializer = variable.getInitializer()
                        .map(Expression::toString)
                        .orElse(null);
                String javaType = typeAsString(variable.getType());
                String fieldName = variable.getNameAsString();
                if (!fieldDesc.isEmpty()) {
                    textChannels.add(new TextChannel(
                            "@Schema.description",
                            fieldDesc,
                            relativeFile,
                            fieldLine,
                            className + "." + fieldName,
                            classRequirements
                    ));
                }
                fields.add(new DtoField(
                        fieldName,
                        javaType,
                        fieldDesc,
                        fieldLine,
                        initializer,
                        annotationNames
                ));
            }
        }

        return new DtoEntry(
                classRequirements,
                className,
                relativeFile,
                classSchemaDescription,
                classSchemaLine,
                fields,
                "class"
        );
    }

    private static String typeAsString(Type type) {
        if (type.isClassOrInterfaceType()) {
            var classOrInterface = type.asClassOrInterfaceType();
            String name = classOrInterface.getNameAsString();
            if (classOrInterface.getTypeArguments().isPresent()) {
                var args = classOrInterface.getTypeArguments().get();
                if (!args.isEmpty()) {
                    StringBuilder sb = new StringBuilder(name).append("<");
                    for (int i = 0; i < args.size(); i++) {
                        if (i > 0) sb.append(", ");
                        sb.append(typeAsString(args.get(i)));
                    }
                    sb.append(">");
                    return sb.toString();
                }
            }
            return name;
        }
        return type.asString();
    }

    private static List<String> classLiteralNames(Expression expression) {
        List<String> names = new ArrayList<>();
        if (expression instanceof ArrayInitializerExpr array) {
            for (Expression value : array.getValues()) {
                names.addAll(classLiteralNames(value));
            }
            return names;
        }
        String text = expression.toString();
        if (text.endsWith(".class")) {
            text = text.substring(0, text.length() - ".class".length());
            int dot = text.lastIndexOf('.');
            names.add(dot >= 0 ? text.substring(dot + 1) : text);
        }
        return names;
    }

    private static List<TestEntry> readTests(
            Path workspaceRoot,
            Path testJavaRoot,
            String scope,
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
                            scope,
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

    private static String testScope(Path testJavaRoot) {
        return "application";
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

    /**
     * Returns the unqualified simple identifier of an annotation, so a downstream consumer
     * comparing names ("RequestBody" etc.) treats `@RequestBody` and `@org.springframework
     * .web.bind.annotation.RequestBody` identically.
     */
    private static String simpleAnnotationName(AnnotationExpr annotation) {
        return annotation.getName().getIdentifier();
    }

    private static final String SPRING_REQUEST_BODY_PKG = "org.springframework.web.bind.annotation";
    private static final String SWAGGER_REQUEST_BODY_PKG = "io.swagger.v3.oas.annotations.parameters";
    private static final String SPRING_REQUEST_BODY_FQN = SPRING_REQUEST_BODY_PKG + ".RequestBody";
    private static final String SWAGGER_REQUEST_BODY_FQN = SWAGGER_REQUEST_BODY_PKG + ".RequestBody";

    /**
     * Returns true only for Spring's {@code @RequestBody}, not Swagger's
     * {@code @io.swagger.v3.oas.annotations.parameters.RequestBody}. Resolves through imports
     * when the annotation is written as a simple name; checks the fully written name when it
     * is qualified inline. Honors JLS §6.4.1 import precedence (single-type-import outranks
     * on-demand import) and recognizes wildcard imports of either package.
     */
    private static boolean isSpringRequestBody(AnnotationExpr annotation) {
        String written = annotation.getNameAsString();
        if (written.contains(".")) {
            return SPRING_REQUEST_BODY_FQN.equals(written);
        }
        if (!"RequestBody".equals(written)) {
            return false;
        }
        Optional<CompilationUnit> cu = annotation.findCompilationUnit();
        if (cu.isEmpty()) {
            // No CU context — fall back to assuming Spring (controller params almost always import Spring).
            return true;
        }
        boolean springExplicit = false;
        boolean swaggerExplicit = false;
        boolean springWildcard = false;
        boolean swaggerWildcard = false;
        for (ImportDeclaration imp : cu.get().getImports()) {
            if (imp.isStatic()) {
                continue;
            }
            String name = imp.getNameAsString();
            if (imp.isAsterisk()) {
                if (SPRING_REQUEST_BODY_PKG.equals(name)) {
                    springWildcard = true;
                } else if (SWAGGER_REQUEST_BODY_PKG.equals(name)) {
                    swaggerWildcard = true;
                }
            } else if (SPRING_REQUEST_BODY_FQN.equals(name)) {
                springExplicit = true;
            } else if (SWAGGER_REQUEST_BODY_FQN.equals(name)) {
                swaggerExplicit = true;
            }
        }
        // Single-type imports outrank on-demand imports (JLS §6.4.1).
        if (springExplicit) {
            return true;
        }
        if (swaggerExplicit) {
            return false;
        }
        if (springWildcard && swaggerWildcard) {
            // Both packages on-demand-imported. Real Java compiler rejects the bare reference
            // as ambiguous; treat conservatively as non-Spring so a Swagger doc-only annotation
            // is never mistaken for a real HTTP body.
            return false;
        }
        if (springWildcard) {
            return true;
        }
        if (swaggerWildcard) {
            return false;
        }
        // Neither imported: in Spring MVC controllers the bare @RequestBody comes from the
        // Spring side. The Swagger annotation is rarely used without an explicit import.
        return true;
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
            List<RepositoryEntry> repositories,
            List<ServiceEntry> services,
            List<BeanEntry> beans,
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
        appendRepositories(builder, repositories);
        builder.append(",\n");
        appendServices(builder, services);
        builder.append(",\n");
        appendBeans(builder, beans);
        builder.append(",\n");
        appendTextChannels(builder, textChannels);
        builder.append("\n}\n");
        return builder.toString();
    }

    private static void appendBeans(StringBuilder builder, List<BeanEntry> beans) {
        builder.append("  \"beans\": [\n");
        for (int i = 0; i < beans.size(); i++) {
            BeanEntry bean = beans.get(i);
            builder.append("    {\n");
            builder.append("      \"containerClass\": ").append(json(bean.containerClass())).append(",\n");
            builder.append("      \"methodName\": ").append(json(bean.methodName())).append(",\n");
            builder.append("      \"returnType\": ").append(json(bean.returnType())).append(",\n");
            builder.append("      \"body\": ").append(json(bean.body())).append(",\n");
            builder.append("      \"file\": ").append(json(bean.file())).append("\n");
            builder.append("    }");
            builder.append(i + 1 < beans.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
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
            builder.append("      \"line\": ").append(api.line()).append(",\n");
            builder.append("      \"returnType\": ").append(json(api.returnType())).append(",\n");
            builder.append("      \"operationSummary\": ").append(json(api.operationSummary())).append(",\n");
            builder.append("      \"operationSummaryLine\": ").append(api.operationSummaryLine()).append(",\n");
            builder.append("      \"operationDescription\": ").append(json(api.operationDescription())).append(",\n");
            builder.append("      \"operationDescriptionLine\": ").append(api.operationDescriptionLine()).append(",\n");
            builder.append("      \"parameters\": [\n");
            List<ParameterEntry> params = api.parameters();
            for (int j = 0; j < params.size(); j++) {
                ParameterEntry p = params.get(j);
                builder.append("        {\n");
                builder.append("          \"name\": ").append(json(p.name())).append(",\n");
                builder.append("          \"javaType\": ").append(json(p.javaType())).append(",\n");
                builder.append("          \"annotations\": ").append(jsonArray(p.annotations())).append(",\n");
                builder.append("          \"requestHeaderName\": ").append(p.requestHeaderName() == null ? "null" : json(p.requestHeaderName())).append(",\n");
                builder.append("          \"springRequestBody\": ").append(p.springRequestBody() ? "true" : "false").append("\n");
                builder.append("        }");
                builder.append(j + 1 < params.size() ? "," : "").append("\n");
            }
            builder.append("      ],\n");
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
            builder.append("      \"scope\": ").append(json(test.scope())).append(",\n");
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
            builder.append("      \"listeners\": ").append(jsonArray(entity.listeners())).append(",\n");
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
                builder.append("          \"updatable\": ").append(column.updatable() == null ? "null" : column.updatable()).append(",\n");
                builder.append("          \"length\": ").append(column.length() == null ? "null" : column.length()).append(",\n");
                builder.append("          \"annotations\": ").append(jsonArray(column.annotations())).append("\n");
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
            builder.append("      \"kind\": ").append(json(dto.kind())).append(",\n");
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
                builder.append("          \"line\": ").append(field.line()).append(",\n");
                builder.append("          \"initializer\": ").append(field.initializer() == null ? "null" : json(field.initializer())).append(",\n");
                builder.append("          \"annotations\": ").append(jsonArray(field.annotations())).append("\n");
                builder.append("        }");
                builder.append(j + 1 < fields.size() ? "," : "").append("\n");
            }
            builder.append("      ]\n");
            builder.append("    }");
            builder.append(i + 1 < dtos.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
    }

    private static void appendRepositories(StringBuilder builder, List<RepositoryEntry> repositories) {
        builder.append("  \"repositories\": [\n");
        for (int i = 0; i < repositories.size(); i++) {
            RepositoryEntry repo = repositories.get(i);
            builder.append("    {\n");
            builder.append("      \"requirements\": ").append(jsonArray(repo.requirements())).append(",\n");
            builder.append("      \"className\": ").append(json(repo.className())).append(",\n");
            builder.append("      \"file\": ").append(json(repo.file())).append(",\n");
            builder.append("      \"targetEntity\": ").append(repo.targetEntity() == null ? "null" : json(repo.targetEntity())).append(",\n");
            builder.append("      \"methods\": [\n");
            List<RepoMethodEntry> methods = repo.methods();
            for (int j = 0; j < methods.size(); j++) {
                RepoMethodEntry m = methods.get(j);
                builder.append("        {\n");
                builder.append("          \"name\": ").append(json(m.name())).append(",\n");
                builder.append("          \"returnType\": ").append(json(m.returnType())).append(",\n");
                builder.append("          \"parameterTypes\": ").append(jsonArray(m.parameterTypes())).append("\n");
                builder.append("        }");
                builder.append(j + 1 < methods.size() ? "," : "").append("\n");
            }
            builder.append("      ]\n");
            builder.append("    }");
            builder.append(i + 1 < repositories.size() ? "," : "").append("\n");
        }
        builder.append("  ]");
    }

    private static void appendServices(StringBuilder builder, List<ServiceEntry> services) {
        builder.append("  \"services\": [\n");
        for (int i = 0; i < services.size(); i++) {
            ServiceEntry svc = services.get(i);
            builder.append("    {\n");
            builder.append("      \"requirements\": ").append(jsonArray(svc.requirements())).append(",\n");
            builder.append("      \"className\": ").append(json(svc.className())).append(",\n");
            builder.append("      \"file\": ").append(json(svc.file())).append(",\n");
            builder.append("      \"classTransactional\": ").append(svc.classTransactional()).append(",\n");
            builder.append("      \"classTransactionalReadOnly\": ").append(svc.classTransactionalReadOnly() == null ? "null" : svc.classTransactionalReadOnly()).append(",\n");
            builder.append("      \"fields\": [\n");
            List<ServiceFieldEntry> svcFields = svc.fields();
            for (int j = 0; j < svcFields.size(); j++) {
                ServiceFieldEntry sf = svcFields.get(j);
                builder.append("        { \"name\": ").append(json(sf.name())).append(", \"type\": ").append(json(sf.type())).append(" }");
                builder.append(j + 1 < svcFields.size() ? "," : "").append("\n");
            }
            builder.append("      ],\n");
            builder.append("      \"methods\": [\n");
            List<ServiceMethodEntry> methods = svc.methods();
            for (int j = 0; j < methods.size(); j++) {
                ServiceMethodEntry m = methods.get(j);
                builder.append("        {\n");
                builder.append("          \"name\": ").append(json(m.name())).append(",\n");
                builder.append("          \"isPublic\": ").append(m.isPublic()).append(",\n");
                builder.append("          \"hasMethodTransactional\": ").append(m.hasMethodTransactional()).append(",\n");
                builder.append("          \"methodTransactionalReadOnly\": ").append(m.methodTransactionalReadOnly() == null ? "null" : m.methodTransactionalReadOnly()).append(",\n");
                builder.append("          \"returnType\": ").append(json(m.returnType())).append(",\n");
                builder.append("          \"parameterTypes\": ").append(jsonArray(m.parameterTypes())).append("\n");
                builder.append("        }");
                builder.append(j + 1 < methods.size() ? "," : "").append("\n");
            }
            builder.append("      ]\n");
            builder.append("    }");
            builder.append(i + 1 < services.size() ? "," : "").append("\n");
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
