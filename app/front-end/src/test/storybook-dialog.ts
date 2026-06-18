import { expect, waitFor, within } from "storybook/test"

type PopupRole = "dialog" | "alertdialog"
type PopupName = string | RegExp

export type StoryScope = ReturnType<typeof within>

function openPopup(role: PopupRole, name: PopupName): HTMLElement | undefined {
  return within(document.body)
    .queryAllByRole(role, { name, hidden: true })
    .slice()
    .reverse()
    .find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.hasAttribute("data-open"),
    )
}

async function withinCurrentPopup(role: PopupRole, name: PopupName): Promise<StoryScope> {
  let activeElement: HTMLElement | undefined
  await waitFor(() => {
    activeElement = openPopup(role, name)
    expect(activeElement).toBeDefined()
    expect(activeElement).toBeVisible()
  })
  return within(activeElement!)
}

export const withinCurrentDialog = (name: PopupName) =>
  withinCurrentPopup("dialog", name)

export const withinCurrentAlertDialog = (name: PopupName) =>
  withinCurrentPopup("alertdialog", name)

export const expectCurrentPopupClosed = async (
  role: PopupRole,
  name: PopupName,
) => {
  await waitFor(() => expect(openPopup(role, name)).toBeUndefined())
}
