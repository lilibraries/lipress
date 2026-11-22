import { isValidElement } from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactElement } from "react";

import { useTheme } from "../../providers/ThemeProvider";
import "./index.scss";

interface BrandLogo {
  light?: string | ReactElement;
  dark?: string | ReactElement;
}

type BrandProps<E extends ElementType> = Omit<
  ComponentPropsWithoutRef<E>,
  "children" | "className"
> & {
  as?: E;
  logo?: string | ReactElement | BrandLogo;
  title?: string;
};

function Brand<E extends ElementType = "a">(props: BrandProps<E>) {
  const { as, logo, title, ...rest } = props;
  const { resolvedTheme } = useTheme();
  const Component = as ?? "a";
  const themed = typeof logo === "object" && logo !== null && !isValidElement(logo);
  const lightSource = themed ? (logo.light ?? logo.dark) : logo;
  const darkSource = themed ? (logo.dark ?? logo.light) : logo;
  const source = resolvedTheme === "dark" ? darkSource : lightSource;

  return (
    <Component {...rest} className="lipress-brand">
      {source != null && (
        <span className="lipress-brand-logo" aria-hidden="true">
          {typeof source === "string" ? <img src={source} alt="" /> : source}
        </span>
      )}
      {title != null && <span className="lipress-brand-title">{title}</span>}
    </Component>
  );
}

export default Brand;
