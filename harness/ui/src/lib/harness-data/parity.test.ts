import { describe, expect, it } from "vitest";
import { buildRequirementDetailModel } from "./artifact-api";
import { hasArtifactScope, workspaceRootForArtifactScope } from "./artifact-test-workspace";
import { appRequirementDetail, appRequirementListDetail, requirementDetail } from "./fixtures";

// fixture(Storybook/단위 테스트 입력)가 라이브 build*Model 출력과 어긋나면 (UI) 수용 기준이
// 라이브에서 재현되지 않는데도 GREEN/BLUE 를 통과하는 검증 채널 허점이 생긴다. 이 self-test는
// 백엔드 표면 채움 규칙을 라이브 출력과 직접 대조해 그 허점을 닫는다.
//
// runner run root에 trace.state.json 이 생성돼 있으면 그 산출물을, 없으면 canonical build를 읽는다.
// 게이트는 UI 단위 테스트 뒤에 trace state를 생성하므로 in-gate parity는 canonical(직전 publish)을
// 읽고, 둘 다 없으면(최초 clean 실행) 해당 scope 대조를 skip한다. repo:validate/*:trace 선행 시 완전 검증된다.

const appWorkspaceRoot = workspaceRootForArtifactScope("app");
const harnessWorkspaceRoot = workspaceRootForArtifactScope("harness");
const itApp = hasArtifactScope("app") ? it : it.skip;
const itHarness = hasArtifactScope("harness") ? it : it.skip;

describe("fixture ↔ live build*Model parity", () => {
  itApp("appRequirementDetail 백엔드 표면은 라이브 REQ-022 출력과 동일하다", () => {
    const live = buildRequirementDetailModel("application", "REQ-022", appWorkspaceRoot);
    expect(live).toBeTruthy();
    expect(appRequirementDetail.apiSurfaces).toEqual(live!.apiSurfaces);
    expect(appRequirementDetail.dataShapes).toEqual(live!.dataShapes);
    expect(appRequirementDetail.entitySurfaces).toEqual(live!.entitySurfaces);
  });

  itApp("appRequirementListDetail 백엔드 표면은 라이브 REQ-023(PageResponse 목록) 출력과 동일하다", () => {
    const live = buildRequirementDetailModel("application", "REQ-023", appWorkspaceRoot);
    expect(live).toBeTruthy();
    expect(appRequirementListDetail.apiSurfaces).toEqual(live!.apiSurfaces);
    expect(appRequirementListDetail.dataShapes).toEqual(live!.dataShapes);
    expect(appRequirementListDetail.entitySurfaces).toEqual(live!.entitySurfaces);
  });

  itHarness("하네스 요건 fixture와 라이브 REQ-031 은 백엔드 표면이 비어 있다", () => {
    const live = buildRequirementDetailModel("harness", "REQ-031", harnessWorkspaceRoot);
    expect(live).toBeTruthy();
    expect(live!.apiSurfaces).toEqual([]);
    expect(live!.dataShapes).toEqual([]);
    expect(live!.entitySurfaces).toEqual([]);
    expect(requirementDetail.apiSurfaces).toEqual([]);
    expect(requirementDetail.dataShapes).toEqual([]);
    expect(requirementDetail.entitySurfaces).toEqual([]);
  });

  itApp("라이브 앱 요건 dataShapes 는 DTO 필드를 채운다(빈 fields 회귀 방지)", () => {
    const live = buildRequirementDetailModel("application", "REQ-022", appWorkspaceRoot);
    const request = live!.dataShapes.find((shape) => shape.kind === "Request");
    expect(request).toBeTruthy();
    expect(request!.fields.length).toBeGreaterThan(0);
    expect(request!.fields.every((field) => field.name && field.type)).toBe(true);
    // 응답 DTO가 다른 객체를 참조하면 중첩 shape 가 dataShapes 에 함께 들어온다.
    expect(live!.dataShapes.some((shape) => shape.kind === "Object")).toBe(true);
  });

  itApp("라이브 목록 응답 dataShapes 는 제네릭 PageResponse 필드와 content DTO를 채운다", () => {
    const categoryList = buildRequirementDetailModel("application", "REQ-016", appWorkspaceRoot);
    const todoList = buildRequirementDetailModel("application", "REQ-023", appWorkspaceRoot);

    const categoryPage = categoryList!.dataShapes.find((shape) => shape.name === "PageResponse<CategoryResponse>");
    expect(categoryPage).toBeTruthy();
    expect(categoryPage!.fields.map((field) => `${field.name}:${field.type}`)).toContain("content:List<CategoryResponse>");
    expect(categoryPage!.fields.map((field) => field.name)).toEqual(["content", "page", "size", "totalElements", "totalPages"]);
    expect(categoryList!.dataShapes.find((shape) => shape.kind === "Object" && shape.name === "CategoryResponse")?.fields.length).toBeGreaterThan(0);

    const todoPage = todoList!.dataShapes.find((shape) => shape.name === "PageResponse<TodoResponse>");
    expect(todoPage).toBeTruthy();
    expect(todoPage!.fields.map((field) => `${field.name}:${field.type}`)).toContain("content:List<TodoResponse>");
    expect(todoList!.dataShapes.find((shape) => shape.kind === "Object" && shape.name === "TodoResponse")?.fields.length).toBeGreaterThan(0);
    expect(todoList!.dataShapes.find((shape) => shape.kind === "Object" && shape.name === "TodoCategoryInfo")?.fields.length).toBeGreaterThan(0);
  });

  itApp("빈 본문 응답은 Void dataShape 를 만들지 않는다", () => {
    for (const requirementId of ["REQ-011", "REQ-019", "REQ-025"]) {
      const live = buildRequirementDetailModel("application", requirementId, appWorkspaceRoot);
      expect(live!.apiSurfaces.flatMap((api) => api.responses)).not.toContain("Void");
      expect(live!.dataShapes.map((shape) => shape.name)).not.toContain("Void");
    }
  });
});
