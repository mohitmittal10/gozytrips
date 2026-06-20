import React from "react";
import { CustomTooltip as Tooltip } from "./custom-tooltip";

export type TTabVariant = "primary" | "secondary";

export interface ITab {
  title?: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
}

interface TabsProps {
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  tabs: ITab[];
  disabled?: boolean;
  variant?: TTabVariant;
}

interface TabProps extends ITab {
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  variant: TTabVariant;
}

const getClasses = (isSelected: boolean, disabled: boolean, variant: TTabVariant) => {
  let classes = `relative overflow-visible box-border font-sans text-sm flex items-center justify-center gap-2 duration-300 transition-all ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`;
  if (isSelected) {
    if (variant === "primary") {
      classes += " border-b-2 border-primary -mb-0.5 text-primary";
    } else if (variant === "secondary") {
      classes += " bg-gray-1000";
    }
  } else {
    if (variant === "secondary") {
      if (disabled) {
        classes += " bg-gray-200";
      } else {
        classes += " bg-gray-alpha-200";
      }
    }
  }
  if (variant === "primary") {
    classes += " pb-[5px] hover:text-primary";
  } else if (variant === "secondary") {
    classes += " h-6 rounded-md text-[13px] px-1.5 items-center";
  }
  if (disabled) {
    classes += isSelected ? " text-gray-1000" : " text-gray-900";
  } else {
    if (variant === "primary") {
      classes += isSelected ? " text-primary" : " text-foreground/80";
    } else {
      classes += isSelected ? " text-background-100" : " text-gray-1000";
    }
  }

  return classes;
};

const Tab = ({
  selected,
  setSelected,
  title,
  value,
  disabled = false,
  icon,
  variant
}: TabProps) => {
  if (!title && !icon) {
    return null;
  }

  return (
    <div
      className={getClasses(selected === value, disabled, variant)}
      onClick={() => {
        if (!disabled) {
          setSelected(value);
        }
      }}
    >
      {icon && <div className="flex items-center justify-center transition-transform duration-300">{icon}</div>}
      {title && <div className="font-semibold">{title}</div>}
    </div>
  );
};

export const CustomTabs = ({
  selected,
  setSelected,
  tabs,
  disabled = false,
  variant = "primary"
}: TabsProps) => {
  return (
    <div
      className={`flex${disabled ? " cursor-not-allowed" : ""} ${variant === "primary" ? "gap-6 pb-[1px] border-b border-white/10" : "gap-2"}`}>
      {tabs.map((tab) => tab.tooltip ? (
        <Tooltip text={tab.tooltip} key={tab.value}>
          <Tab
            selected={selected}
            setSelected={setSelected}
            disabled={disabled || tab.disabled}
            variant={variant}
            {...tab}
          />
        </Tooltip>
      ) : (
        <Tab
          key={tab.value}
          selected={selected}
          setSelected={setSelected}
          disabled={disabled || tab.disabled}
          variant={variant}
          {...tab}
        />
      ))}
    </div>
  );
};
