import type { Page, Request, Route } from "@playwright/test"

type ApiRouteUrl = Parameters<Page["route"]>[0]
type ApiRouteHandler = (
  route: Route,
  request: Request,
) => Promise<void> | void

export async function routeApi(
  page: Page,
  url: ApiRouteUrl,
  handler: ApiRouteHandler,
): Promise<void> {
  await page.route(url, async (route) => {
    const request = route.request()
    if (request.resourceType() === "document") {
      await route.fallback()
      return
    }
    await handler(route, request)
  })
}
