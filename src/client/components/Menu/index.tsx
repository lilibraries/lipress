import cn from "classnames";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import "./index.scss";

interface MenuProps {
  children?: ReactNode;
}

interface MenuGroupProps {
  title?: ReactNode;
  children?: ReactNode;
}

type MenuItemProps<E extends ElementType> = Omit<ComponentPropsWithoutRef<E>, "className"> & {
  as?: E;
  active?: boolean;
};

function Menu({ children }: MenuProps) {
  return <ul className="lipress-menu">{children}</ul>;
}

function MenuGroup({ title, children }: MenuGroupProps) {
  return (
    <li className="lipress-menu-group">
      {title != null && <div className="lipress-menu-group-title">{title}</div>}
      <ul className="lipress-menu-list">{children}</ul>
    </li>
  );
}

function MenuItem<E extends ElementType = "a">(props: MenuItemProps<E>) {
  const { as, active, ...rest } = props;
  const Component = as ?? "a";

  return (
    <li className="lipress-menu-item">
      <Component
        {...rest}
        className={cn("lipress-menu-link", active && "lipress-menu-link-active")}
        aria-current={active ? "page" : undefined}
      />
    </li>
  );
}

Menu.Group = MenuGroup;
Menu.Item = MenuItem;

export default Menu;
