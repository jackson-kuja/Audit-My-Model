"use client"

import * as React from "react"
import { 
  Menu, 
  MenuItem, 
  Button, 
  Divider, 
  Popover, 
  Typography,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { cn } from "../../lib/utils"

// Interfaces for our dropdown components
interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  forceMount?: boolean;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  inset?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

interface DropdownMenuShortcutProps {
  className?: string;
  children: React.ReactNode;
}

// Create a context to share the dropdown state
const DropdownContext = React.createContext<{
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}>({
  anchorEl: null,
  setAnchorEl: () => {},
});

// Main dropdown container
export function DropdownMenu({ children }: DropdownMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  
  return (
    <DropdownContext.Provider value={{ anchorEl, setAnchorEl }}>
      {children}
    </DropdownContext.Provider>
  );
}

// The trigger button for the dropdown
export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const { setAnchorEl } = React.useContext(DropdownContext);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  if (asChild) {
    const childElement = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(childElement, {
      onClick: handleClick,
    });
  }
  
  return <div onClick={handleClick}>{children}</div>;
}

// The content container of the dropdown
export function DropdownMenuContent({ 
  children, 
  className, 
  align = 'center', 
  forceMount 
}: DropdownMenuContentProps) {
  const { anchorEl, setAnchorEl } = React.useContext(DropdownContext);
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Convert align to MUI's anchorOrigin
  const getAnchorOrigin = () => {
    switch (align) {
      case 'start':
        return { vertical: 'bottom', horizontal: 'left' } as const;
      case 'end':
        return { vertical: 'bottom', horizontal: 'right' } as const;
      default:
        return { vertical: 'bottom', horizontal: 'center' } as const;
    }
  };
  
  return (
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={getAnchorOrigin()}
      transformOrigin={{
        vertical: 'top',
        horizontal: align === 'start' ? 'left' : align === 'end' ? 'right' : 'center',
      }}
      className={className}
    >
      {children}
    </Menu>
  );
}

// Individual dropdown menu items
export function DropdownMenuItem({ 
  children, 
  onClick, 
  className, 
  inset, 
  disabled,
  icon
}: DropdownMenuItemProps) {
  const { setAnchorEl } = React.useContext(DropdownContext);
  
  const handleClick = () => {
    if (onClick) onClick();
    // Close the dropdown after clicking an item
    setAnchorEl(null);
  };
  
  return (
    <MenuItem 
      onClick={handleClick} 
      className={className}
      disabled={disabled}
      sx={{ pl: inset ? 4 : undefined }}
    >
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText>{children}</ListItemText>
    </MenuItem>
  );
}

// Label for dropdown sections
export function DropdownMenuLabel({ children, className, inset }: DropdownMenuLabelProps) {
  return (
    <Typography 
      variant="subtitle2" 
      className={className} 
      sx={{
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        color: 'text.secondary',
        pl: inset ? 4 : undefined
      }}
    >
      {children}
    </Typography>
  );
}

// Separator line
export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <Divider className={className} />;
}

// For keyboard shortcuts
export function DropdownMenuShortcut({ 
  className, 
  children 
}: DropdownMenuShortcutProps) {
  return (
    <Typography
      variant="caption"
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      component="span"
    >
      {children}
    </Typography>
  );
}

// Checkbox and Radio variants can be implemented if needed

// Export any grouped components that might be needed
export const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuCheckboxItem = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuRadioItem = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>; 