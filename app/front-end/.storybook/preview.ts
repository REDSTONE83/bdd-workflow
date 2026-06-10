import type { Preview } from "@storybook/react-vite"
import {
  Controls,
  Description,
  DocsContext,
  Markdown,
  Primary,
  Title,
} from "@storybook/addon-docs/blocks"
import { Fragment, createElement, useContext } from "react"

import "../src/index.css"
import "./preview.css"

type DocsStorySummary = {
  id: string
  name: string
  parameters?: {
    docs?: {
      description?: {
        story?: string
      }
    }
    harness?: {
      docs?: {
        omitComponentProperties?: boolean
        omitPrimaryCanvas?: boolean
      }
    }
  }
}

const storyDescription = (story: DocsStorySummary) =>
  story.parameters?.docs?.description?.story?.trim() ?? ""

const StateDescriptions = () => {
  const docsContext = useContext(DocsContext)
  const stories = docsContext.componentStories() as unknown as DocsStorySummary[]
  const stateStories = stories
    .slice(1)
    .map((story) => ({ ...story, description: storyDescription(story) }))
    .filter((story) => story.description.length > 0)

  if (stateStories.length === 0) return null

  return createElement(
    "section",
    { className: "sbdocs sbdocs-section" },
    createElement("h2", null, "상태 설명"),
    createElement(
      "p",
      null,
      "각 상태 화면은 좌측 story 목록의 named export로 직접 진입해 확인한다.",
    ),
    createElement(
      "div",
      null,
      ...stateStories.map((story) =>
        createElement(
          "article",
          { key: story.id, className: "sbdocs sbdocs-preview" },
          createElement(
            "h3",
            null,
            createElement(
              "a",
              { href: `/?path=/story/${story.id}`, target: "_top" },
              story.name,
            ),
          ),
          createElement(Markdown, null, story.description),
        ),
      ),
    ),
  )
}

const PrimaryCanvas = () => {
  const docsContext = useContext(DocsContext)
  const primaryStory = docsContext
    .componentStories()
    .at(0) as unknown as DocsStorySummary | undefined

  if (!primaryStory?.parameters?.harness?.docs?.omitPrimaryCanvas) {
    return createElement(Primary)
  }

  return createElement(
    "section",
    { className: "sbdocs sbdocs-section" },
    createElement("h2", null, "대표 화면"),
    createElement(
      "p",
      null,
      "Docs에서는 열린 modal이 본문을 덮지 않도록 대표 canvas를 생략한다. 상태 화면은 좌측 story 목록 또는 상태 설명 링크에서 직접 확인한다.",
    ),
  )
}

const ComponentProperties = () => {
  const docsContext = useContext(DocsContext)
  const primaryStory = docsContext
    .componentStories()
    .at(0) as unknown as DocsStorySummary | undefined
  const docsOptions = primaryStory?.parameters?.harness?.docs

  if (docsOptions?.omitComponentProperties || docsOptions?.omitPrimaryCanvas) {
    return null
  }

  return createElement(Controls)
}

const DocsPage = () =>
  createElement(
    Fragment,
    null,
    createElement(Title),
    createElement(Description),
    createElement(Description, { of: "story" }),
    createElement(PrimaryCanvas),
    createElement(ComponentProperties),
    createElement(StateDescriptions),
  )

const preview: Preview = {
  parameters: {
    a11y: {
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      canvas: {
        sourceState: "shown",
      },
      page: DocsPage,
    },
  },
}

export default preview
