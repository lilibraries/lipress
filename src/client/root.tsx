import { Route, Routes } from "react-router-dom";

import Brand from "./components/Brand";
import Layout from "./components/Layout";
import Menu from "./components/Menu";
import Segments from "./components/Segments";
import Toc, { type TocItem } from "./components/Toc";
import useScrollRestoration from "./hooks/useScrollRestoration";
import MonitorIcon from "./icons/MonitorIcon";
import MoonIcon from "./icons/MoonIcon";
import SunIcon from "./icons/SunIcon";
import ThemeProvider, { useTheme } from "./providers/ThemeProvider";

interface PreviewSection {
  slug: string;
  title: string;
  description: string;
  points?: string[];
  children?: PreviewSection[];
}

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

const previewDocument: PreviewSection[] = [
  {
    slug: "quick-start",
    title: "Quick start",
    description:
      "Lipress turns a folder of Markdown files into a documentation site. These steps cover the whole path from an empty project to a running preview.",
    points: [
      "Install the package with the package manager the project already uses.",
      "Point the configuration at the folder that holds the documentation.",
      "Open the preview, edit a page, and watch the browser pick up the change.",
    ],
    children: [
      {
        slug: "install-lipress",
        title: "Install Lipress",
        description:
          "Add the package to the documentation project and keep its lockfile in version control.",
        children: [
          {
            slug: "package-managers",
            title: "Package managers",
            description:
              "Lipress ships as an npm package, so every client that follows the registry can install it, and the project only needs a single lockfile.",
            children: [
              {
                slug: "version-pinning",
                title: "Version pinning",
                description:
                  "Pin the exact version so every contributor builds the site with the same client and theme.",
                children: [
                  {
                    slug: "registry-mirrors",
                    title: "Registry mirrors",
                    description:
                      "A mirror keeps installs fast on restricted networks. Configure it once per project and leave the rest of the workflow untouched.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        slug: "dev-server",
        title: "Run the dev server",
        description:
          "The dev command rebuilds the client, starts the server, and restarts it whenever a source file changes.",
        children: [
          {
            slug: "watch-mode",
            title: "Watch mode",
            description:
              "Keep the terminal open while writing. A rebuild replaces the running server without dropping the page under test.",
          },
        ],
      },
    ],
  },
  {
    slug: "structure",
    title: "Document structure",
    description:
      "The documentation folder maps onto the site: file paths become routes, and headings become the table of contents.",
    children: [
      {
        slug: "pages",
        title: "Pages",
        description:
          "Every Markdown file is a page. Its file name becomes the route, and its first heading becomes the page title.",
        children: [
          {
            slug: "front-matter",
            title: "Front matter",
            description:
              "Front matter overrides the title, order, and layout of a page without changing its path.",
          },
        ],
      },
      {
        slug: "navigation",
        title: "Navigation",
        description:
          "Navigation is generated from the pages themselves, so moving a file moves its entry as well.",
        children: [
          {
            slug: "sidebar-groups",
            title: "Sidebar groups",
            description:
              "Directories become sidebar groups, and their order follows the numbered prefixes of the folder names.",
          },
          {
            slug: "table-of-contents",
            title: "Table of contents",
            description:
              "Second and third level headings of the current page appear in the rail on the right.",
          },
        ],
      },
    ],
  },
  {
    slug: "examples",
    title: "Component examples",
    description:
      "Documentation pages mix prose with live components. The blocks below stand in for those demos.",
    children: [
      {
        slug: "buttons",
        title: "Buttons",
        description:
          "Buttons show the accent color in every theme, which makes them a quick check for contrast.",
      },
      {
        slug: "cards",
        title: "Cards",
        description:
          "Cards combine a surface, a border, and a shadow, so they reveal mistakes in the raised background color.",
        children: [
          {
            slug: "interactive-demos",
            title: "Interactive demos",
            description:
              "A live demo keeps its own state while the page scrolls, and the header above must never interfere with it.",
          },
        ],
      },
    ],
  },
  {
    slug: "themes",
    title: "Theme colors",
    description:
      "Both themes draw from the same palette. Switching themes only swaps resolved values, never the component markup.",
    children: [
      {
        slug: "light-theme",
        title: "Light theme",
        description:
          "The light theme keeps the page white and relies on borders to separate surfaces.",
      },
      {
        slug: "dark-theme",
        title: "Dark theme",
        description:
          "The dark theme darkens the page and raises surfaces with a lighter background instead of stronger borders.",
        children: [
          {
            slug: "contrast",
            title: "Contrast",
            description:
              "Body text keeps the same contrast ratio in both themes; only secondary and placeholder text step down.",
          },
        ],
      },
    ],
  },
  {
    slug: "reading",
    title: "Reading experience",
    description:
      "The header stays pinned while reading. Everything below it should remain legible as it passes underneath.",
    children: [
      {
        slug: "long-pages",
        title: "Long pages",
        description:
          "Long pages stress the sticky header the most, because more content travels behind the frosted background.",
        children: [
          {
            slug: "anchors",
            title: "Anchors",
            description:
              "Headings carry anchors so a section can be linked directly, and the table of contents follows them.",
            children: [
              {
                slug: "deep-links",
                title: "Deep links",
                description:
                  "A deep link lands on the section without hiding it behind the header, because scroll padding accounts for the pinned height.",
              },
            ],
          },
        ],
      },
      {
        slug: "keyboard-navigation",
        title: "Keyboard navigation",
        description:
          "Every link, control, and heading anchor is reachable with the Tab key and shows a visible focus ring.",
      },
    ],
  },
  {
    slug: "long-titles",
    title:
      "Extremely long section titles that keep adding clause after clause until a single line of the content column can no longer hold them",
    description:
      "Long titles stress every surface that repeats them: the heading itself, the sidebar entry, and the table of contents row.",
    children: [
      {
        slug: "wrapped-heading-text",
        title:
          "A nested heading whose wording continues far beyond the width of the reading column and never breaks at a predictable place because it keeps growing",
        description:
          "The nested heading has to wrap inside the content column while its shorter siblings stay on one line.",
        children: [
          {
            slug: "truncated-sidebar-label",
            title: "Sidebar truncation",
            description:
              "The sidebar entry repeats the long title in a much narrower column, so it must truncate instead of pushing the group wider.",
          },
        ],
      },
    ],
  },
  {
    slug: "footer",
    title: "Footer check",
    description:
      "The footer closes the page and sits above the background, so it must never scroll behind the header shadow.",
    children: [
      {
        slug: "license",
        title: "License",
        description:
          "Lipress is released under the MIT license, and the footer repeats that link on every page.",
      },
    ],
  },
];

function headingTag(depth: number) {
  return HEADING_TAGS[Math.min(depth, HEADING_TAGS.length - 1)] ?? "h6";
}

function flattenToc(sections: PreviewSection[], depth = 2): TocItem[] {
  return sections.flatMap(({ slug, title, children }) => [
    { slug, text: title, depth },
    ...(children ? flattenToc(children, depth + 1) : []),
  ]);
}

const previewTocItems = flattenToc(previewDocument);

function PreviewSectionBlock(props: { section: PreviewSection; depth: number; index: number }) {
  const { section, depth, index } = props;
  const Heading = headingTag(depth);

  return (
    <section id={section.slug} style={{ marginBlock: 48 }}>
      <Heading>{section.title}</Heading>
      <p>{section.description}</p>
      {section.points && (
        <ul>
          {section.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      {depth === 2 && (
        <div
          aria-hidden="true"
          style={{
            height: 160,
            marginBlock: 24,
            borderRadius: 12,
            background: `linear-gradient(${index % 2 === 0 ? 120 : 240}deg, var(--lipress-accent-color), #8b5cf6, #f59e0b)`,
          }}
        />
      )}
      {section.children?.map((child, childIndex) => (
        <PreviewSectionBlock
          key={child.slug}
          section={child}
          depth={depth + 1}
          index={childIndex}
        />
      ))}
    </section>
  );
}

function Preview() {
  const { theme, setTheme } = useTheme();
  useScrollRestoration();

  return (
    <Layout
      header={
        <>
          <Brand href="/" title="Lipress" logo={{ light: "/logo.svg", dark: "/logo-dark.svg" }} />
          <Segments value={theme} onChange={setTheme}>
            <Segments.Item value="system" icon={<MonitorIcon />} label="System theme" />
            <Segments.Item value="light" icon={<SunIcon />} label="Light theme" />
            <Segments.Item value="dark" icon={<MoonIcon />} label="Dark theme" />
          </Segments>
        </>
      }
      sidebar={
        <Menu>
          <Menu.Group title="Guide">
            <Menu.Item href="#quick-start">Quick start</Menu.Item>
            <Menu.Item href="#structure">Document structure</Menu.Item>
            <Menu.Item href="#examples">Component examples</Menu.Item>
          </Menu.Group>
          <Menu.Group title="More">
            <Menu.Item href="#themes">Theme colors</Menu.Item>
            <Menu.Item href="#reading">Reading experience</Menu.Item>
          </Menu.Group>
          <Menu.Item href="#long-titles">
            Extremely long section titles that keep adding clause after clause until a single line
            of the sidebar can no longer hold them
          </Menu.Item>
          <Menu.Item href="#footer">Footer check</Menu.Item>
        </Menu>
      }
      toc={<Toc title="On this page" items={previewTocItems} />}
      footer="footer"
    >
      <h1>Hello World</h1>
      <p>
        Welcome to Lipress. This is a long document for checking the frosted-glass header. Scroll
        down to let text and colored areas pass under the header, and watch the background blur, the
        color bleed, and the legibility of the navigation text.
      </p>
      {previewDocument.map((section, index) => (
        <PreviewSectionBlock key={section.slug} section={section} depth={2} index={index} />
      ))}
    </Layout>
  );
}

export default function Root() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="*" element={<Preview />} />
      </Routes>
    </ThemeProvider>
  );
}
