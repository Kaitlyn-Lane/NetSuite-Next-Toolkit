import { useEffect, useRef, useState } from "react";
import { Button, Menu, MenuTrigger, Popover } from "react-aria-components";

import type { MenuNode } from "@/features/nav/types";

import { MenuItem } from "./MenuItem";

// The top-level trigger is NetSuite's own existing button, not something
// we render — MenuTrigger needs some child to satisfy its own wiring, so
// that child is a hidden/inert placeholder, and the real interactive/
// visual anchor is `button` via Popover's triggerRef. Verified in the
// mockup harness that MenuTrigger's nested-submenu coordination still
// works with this split (see ../README.md).
export function RootMenu({ button, groups }: { button: HTMLElement; groups: MenuNode[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(button);

  useEffect(() => {
    function open() {
      setIsOpen(true);
    }
    button.addEventListener("mouseenter", open);
    return () => button.removeEventListener("mouseenter", open);
  }, [button]);

  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button style={{ display: "none" }} aria-hidden="true" />
      <Popover triggerRef={triggerRef} placement="top start">
        <Menu>
          {groups.map((node, i) => (
            <MenuItem key={i} node={node} />
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
