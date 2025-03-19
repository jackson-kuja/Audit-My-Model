declare module '@radix-ui/react-checkbox' {
  import * as React from 'react';
  
  type PrimitiveButtonProps = React.ComponentProps<'button'>;
  type PrimitiveDivProps = React.ComponentProps<'div'>;
  
  export const Root: React.ForwardRefExoticComponent<
    Omit<PrimitiveButtonProps, 'ref'> & {
      checked?: boolean;
      defaultChecked?: boolean;
      onCheckedChange?(checked: boolean): void;
      name?: string;
      value?: string;
      disabled?: boolean;
      required?: boolean;
    } & React.RefAttributes<HTMLButtonElement>
  >;
  
  export const Indicator: React.ForwardRefExoticComponent<
    Omit<PrimitiveDivProps, 'ref'> & { forceMount?: boolean } & React.RefAttributes<HTMLDivElement>
  >;
}

declare module '@radix-ui/react-separator' {
  import * as React from 'react';
  
  type PrimitiveDivProps = React.ComponentProps<'div'>;
  
  export const Root: React.ForwardRefExoticComponent<
    Omit<PrimitiveDivProps, 'ref'> & {
      orientation?: 'horizontal' | 'vertical';
      decorative?: boolean;
    } & React.RefAttributes<HTMLDivElement>
  >;
}

declare module '@radix-ui/react-avatar' {
  import * as React from 'react';
  
  type PrimitiveDivProps = React.ComponentProps<'div'>;
  type PrimitiveSpanProps = React.ComponentProps<'span'>;
  type PrimitiveImgProps = React.ComponentProps<'img'>;
  
  export const Root: React.ForwardRefExoticComponent<
    Omit<PrimitiveDivProps, 'ref'> & React.RefAttributes<HTMLDivElement>
  >;
  
  export const Image: React.ForwardRefExoticComponent<
    Omit<PrimitiveImgProps, 'ref'> & {
      onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
    } & React.RefAttributes<HTMLImageElement>
  >;
  
  export const Fallback: React.ForwardRefExoticComponent<
    Omit<PrimitiveSpanProps, 'ref'> & {
      delayMs?: number;
    } & React.RefAttributes<HTMLSpanElement>
  >;
} 