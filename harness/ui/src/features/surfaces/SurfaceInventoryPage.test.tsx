import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { surfaceInventory } from "../../lib/harness-data/fixtures";
import {
  filterApiSurfaces,
  filterEntitySurfaces,
  filterUiSurfaces,
  SurfaceInventory,
} from "./SurfaceInventoryPage";

describe("SurfaceInventory", () => {
  test("filters API, Entity, and UI surfaces by their identifiers and linked requirements", () => {
    expect(filterApiSurfaces(surfaceInventory.apis, "listTodos").map((item) => item.operationId)).toEqual([
      "TodoController.listTodos",
    ]);
    expect(filterEntitySurfaces(surfaceInventory.entities, "title").map((item) => item.className)).toEqual(["Todo"]);
    expect(filterUiSurfaces(surfaceInventory.uiSurfaces, "REQ-023").map((item) => item.kind)).toEqual([
      "Page",
      "Route",
      "Story",
    ]);
  });

  test("renders the summary, tabs, card list, and item details", () => {
    const html = renderToStaticMarkup(createElement(SurfaceInventory, { model: surfaceInventory }));

    expect(html).toContain("API");
    expect(html).toContain("Entity");
    expect(html).toContain("UI 표면");
    expect(html).toContain("TodoController.createTodo");
    expect(html).toContain("CreateTodoRequest");
    expect(html).toContain("TodoResponse");
    expect(html).toContain("todoId");
    expect(html).toContain("TodoCategoryInfo");
    expect(html).toContain("201");
    expect(html).toContain("todo");
    expect(html).toContain("컬럼");
    expect(html).toContain("TodoListView");
  });

  test("renders Storybook review details when a story surface is selected", () => {
    const html = renderToStaticMarkup(
      createElement(SurfaceInventory, { model: surfaceInventory, initialTab: "ui", initialQuery: "Default" }),
    );

    expect(html).toContain("Storybook 검토");
    expect(html).toContain("App/Todos/TodoListView");
    expect(html).toContain("있음");
  });

  test("renders an empty result for the active tab query", () => {
    const html = renderToStaticMarkup(createElement(SurfaceInventory, { model: surfaceInventory, initialQuery: "no-surface" }));

    expect(html).toContain("조건에 맞는 API가 없다.");
  });
});
