import { type SVGProps } from "react";

import Icon from "./Icon";

export default function MonitorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Icon>
  );
}
