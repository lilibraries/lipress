import { type SVGProps } from "react";

import Icon from "./Icon";

export default function TocIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 5h8" />
      <path d="M4 12h16" />
      <path d="M4 19h10.67" />
    </Icon>
  );
}
