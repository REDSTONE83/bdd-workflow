import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { harnessTest, tempDir, workspaceRoot, writeJson } from '../support/harness-test.ts';

async function loadHarnessUiServer() {
    return import(pathToFileURL(path.join(workspaceRoot, 'harness', 'ui', 'server', 'index.ts')).href);
}

async function listen(server: any) {
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    return `http://127.0.0.1:${address.port}`;
}

async function close(server: any) {
    await new Promise<void>((resolve, reject) => {
        server.close((error: Error | undefined) => error ? reject(error) : resolve());
    });
}

harnessTest({
    requirement: 'REQ-038',
    name: '하네스 UI 서버는 source index 값을 표면 조회 DTO로 보존한다',
    covers: ['하네스 UI 서버가 제공하는 표면 조회 DTO는 source index의 API, Entity, UI 표면 주요 값을 보존한다']
}, async () => {
    const { createHarnessUiServer } = await loadHarnessUiServer();
    const root = tempDir('harness-ui-surfaces-');

    writeJson(path.join(root, 'build', 'app', 'state', 'trace.state.json'), {
        generatedAt: '2026-06-24T00:00:00.000Z',
        requirements: [
            {
                id: 'REQ-900',
                title: 'fixture API',
                state: 'GREEN',
                status: '승인',
                productArea: 'fixture',
                priority: '중간',
                specRole: '원자 요건'
            }
        ]
    });
    writeJson(path.join(root, 'build', 'app', 'indexes', 'backend.source-index.json'), {
        apis: [
            {
                requirements: ['REQ-900'],
                http: 'POST /fixture',
                controller: 'FixtureController.create',
                file: 'app/back-end/src/main/java/example/FixtureController.java',
                line: 11,
                returnType: 'ResponseEntity<FixtureResponse>',
                operationSummary: 'fixture 생성',
                operationDescription: 'fixture API 설명',
                parameters: [
                    { name: 'request', javaType: 'FixtureRequest', springRequestBody: true }
                ],
                responses: [
                    { responseCode: '201', description: '생성 완료', line: 18 }
                ]
            }
        ],
        entities: [
            {
                requirements: ['REQ-900'],
                className: 'FixtureEntity',
                table: 'fixture_entity',
                file: 'app/back-end/src/main/java/example/FixtureEntity.java',
                line: 7,
                listeners: ['AuditingEntityListener'],
                columns: [
                    {
                        requirements: ['REQ-900'],
                        fieldName: 'id',
                        columnName: 'id',
                        javaType: 'UUID',
                        primaryKey: true,
                        generation: null,
                        nullable: false,
                        unique: null,
                        updatable: false,
                        length: null,
                        annotations: ['Id', 'Column']
                    }
                ]
            }
        ],
        dtos: [
            {
                className: 'FixtureRequest',
                file: 'app/back-end/src/main/java/example/FixtureRequest.java',
                schemaLine: 5,
                fields: [
                    {
                        name: 'title',
                        javaType: 'String',
                        annotations: ['NotBlank'],
                        schemaDescription: 'fixture title'
                    }
                ]
            },
            {
                className: 'FixtureResponse',
                file: 'app/back-end/src/main/java/example/FixtureResponse.java',
                schemaLine: 8,
                fields: [
                    {
                        name: 'id',
                        javaType: 'UUID',
                        annotations: [],
                        schemaDescription: 'fixture id'
                    },
                    {
                        name: 'nested',
                        javaType: 'FixtureNested',
                        annotations: [],
                        schemaDescription: 'nested value'
                    }
                ]
            },
            {
                className: 'FixtureNested',
                file: 'app/back-end/src/main/java/example/FixtureNested.java',
                schemaLine: 3,
                fields: [
                    {
                        name: 'name',
                        javaType: 'String',
                        annotations: [],
                        schemaDescription: 'nested name'
                    }
                ]
            }
        ]
    });
    writeJson(path.join(root, 'build', 'app', 'indexes', 'front-end.source-index.json'), {
        generatedAt: '2026-06-24T00:00:00.000Z',
        pages: [
            {
                requirements: ['REQ-900'],
                name: 'FixturePage',
                route: '/fixture',
                file: 'app/front-end/src/features/fixture/FixturePage.tsx',
                line: 3
            }
        ],
        routes: [
            {
                requirements: ['REQ-900'],
                path: '/fixture',
                component: 'FixturePage',
                file: 'app/front-end/src/features/fixture/routes.tsx',
                line: 5
            }
        ],
        stories: [
            {
                requirements: ['REQ-900'],
                title: 'Fixture/Page',
                component: 'FixturePage',
                story: 'Default',
                hasPlay: true,
                hasAssertion: true,
                file: 'app/front-end/src/features/fixture/FixturePage.stories.tsx',
                line: 13
            }
        ]
    });

    const server = createHarnessUiServer({ workspaceRoot: root });
    const baseUrl = await listen(server);
    try {
        const response = await fetch(`${baseUrl}/api/surfaces?scope=application`);
        assert.equal(response.status, 200);
        const body = await response.json();

        assert.equal(body.scope, 'application');
        assert.equal(body.generatedAt, '2026-06-24T00:00:00.000Z');
        assert.equal(body.apis[0].method, 'POST');
        assert.equal(body.apis[0].path, '/fixture');
        assert.equal(body.apis[0].operationId, 'FixtureController.create');
        assert.deepEqual(body.apis[0].requests, ['FixtureRequest']);
        assert.deepEqual(body.apis[0].responseBodies, ['FixtureResponse']);
        assert.deepEqual(body.apis[0].responses, [{ code: '201', description: '생성 완료', line: 18 }]);
        assert.equal(body.dataShapes.find((shape: any) => shape.name === 'FixtureRequest')?.fields[0].name, 'title');
        assert.equal(body.dataShapes.find((shape: any) => shape.name === 'FixtureRequest')?.fields[0].required, true);
        assert.equal(body.dataShapes.find((shape: any) => shape.name === 'FixtureResponse')?.fields[0].name, 'id');
        assert.equal(body.dataShapes.find((shape: any) => shape.name === 'FixtureNested')?.kind, 'Object');
        assert.equal(body.apis[0].requirements[0].id, 'REQ-900');
        assert.equal(body.apis[0].requirements[0].title, 'fixture API');
        assert.equal(body.apis[0].file, 'app/back-end/src/main/java/example/FixtureController.java');
        assert.equal(body.apis[0].line, 11);

        assert.equal(body.entities[0].className, 'FixtureEntity');
        assert.equal(body.entities[0].table, 'fixture_entity');
        assert.equal(body.entities[0].listeners[0], 'AuditingEntityListener');
        assert.equal(body.entities[0].columns[0].columnName, 'id');
        assert.equal(body.entities[0].columns[0].primaryKey, true);

        const route = body.uiSurfaces.find((surface: any) => surface.kind === 'Route');
        const story = body.uiSurfaces.find((surface: any) => surface.kind === 'Story');
        assert.equal(route.route, '/fixture');
        assert.equal(route.name, 'FixturePage');
        assert.equal(story.storybookTitle, 'Fixture/Page');
        assert.equal(story.storybookStory, 'Default');
        assert.equal(story.hasPlay, true);
        assert.equal(story.hasAssertion, true);
        assert.match(story.storybookUrl, /fixture-page--default/);
    } finally {
        await close(server);
    }
});
