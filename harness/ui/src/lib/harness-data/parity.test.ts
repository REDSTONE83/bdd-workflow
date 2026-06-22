import { describe, expect, it } from "vitest";
import { buildRequirementDetailModel } from "./artifact-api";
import { appRequirementDetail, requirementDetail } from "./fixtures";

// fixture(Storybook/단위 테스트 입력)가 라이브 build*Model 출력과 어긋나면 (UI) 수용 기준이
// 라이브에서 재현되지 않는데도 GREEN/BLUE 를 통과하는 검증 채널 허점이 생긴다. 이 self-test는
// 백엔드 표면 채움 규칙을 라이브 출력과 직접 대조해 그 허점을 닫는다.
// build/{app,harness} 산출물이 최신이어야 한다(app:trace/harness:trace 또는 *:validate 선행).
describe("fixture ↔ live build*Model parity", () => {
  it("appRequirementDetail 백엔드 표면은 라이브 REQ-022 출력과 동일하다", () => {
    const live = buildRequirementDetailModel("application", "REQ-022");
    expect(live).toBeTruthy();
    expect(appRequirementDetail.apiSurfaces).toEqual(live!.apiSurfaces);
    expect(appRequirementDetail.dataShapes).toEqual(live!.dataShapes);
    expect(appRequirementDetail.entitySurfaces).toEqual(live!.entitySurfaces);
  });

  it("하네스 요건 fixture와 라이브 REQ-031 은 백엔드 표면이 비어 있다", () => {
    const live = buildRequirementDetailModel("harness", "REQ-031");
    expect(live).toBeTruthy();
    expect(live!.apiSurfaces).toEqual([]);
    expect(live!.dataShapes).toEqual([]);
    expect(live!.entitySurfaces).toEqual([]);
    expect(requirementDetail.apiSurfaces).toEqual([]);
    expect(requirementDetail.dataShapes).toEqual([]);
    expect(requirementDetail.entitySurfaces).toEqual([]);
  });

  it("라이브 앱 요건 dataShapes 는 DTO 필드를 채운다(빈 fields 회귀 방지)", () => {
    const live = buildRequirementDetailModel("application", "REQ-022");
    const request = live!.dataShapes.find((shape) => shape.kind === "Request");
    expect(request).toBeTruthy();
    expect(request!.fields.length).toBeGreaterThan(0);
    expect(request!.fields.every((field) => field.name && field.type)).toBe(true);
    // 응답 DTO가 다른 객체를 참조하면 중첩 shape 가 dataShapes 에 함께 들어온다.
    expect(live!.dataShapes.some((shape) => shape.kind === "Object")).toBe(true);
  });
});
