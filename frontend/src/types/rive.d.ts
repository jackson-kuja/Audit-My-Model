declare module '@rive-app/react-canvas' {
  import { FC } from 'react';

  export class Layout {
    constructor(options?: {
      fit?: Fit;
      alignment?: Alignment;
      minX?: number;
      minY?: number;
      maxX?: number;
      maxY?: number;
    });
  }

  export enum Fit {
    Cover = 'cover',
    Contain = 'contain',
    Fill = 'fill',
    FitWidth = 'fitWidth',
    FitHeight = 'fitHeight',
    None = 'none',
    ScaleDown = 'scaleDown'
  }

  export enum Alignment {
    Center = 'center',
    TopLeft = 'topLeft',
    TopCenter = 'topCenter',
    TopRight = 'topRight',
    CenterLeft = 'centerLeft',
    CenterRight = 'centerRight',
    BottomLeft = 'bottomLeft',
    BottomCenter = 'bottomCenter',
    BottomRight = 'bottomRight'
  }

  export interface UseRiveParameters {
    src: string;
    artboard?: string;
    animations?: string | string[];
    stateMachines?: string | string[];
    layout?: Layout;
    autoplay?: boolean;
    onPlay?: (animationName: string, isStateMachine: boolean) => void;
    onPause?: (animationName: string, isStateMachine: boolean) => void;
    onStop?: (animationName: string, isStateMachine: boolean) => void;
    onLoopEnd?: (animationName: string, isStateMachine: boolean) => void;
    onStateChange?: (stateMachineName: string, stateName: string) => void;
  }

  export interface UseRiveReturnType {
    RiveComponent: FC;
    rive: {
      play: (animationName?: string) => void;
      pause: (animationName?: string) => void;
      stop: (animationName?: string) => void;
      reset: () => void;
      playStateMachine: (stateMachineName?: string) => void;
      pauseStateMachine: (stateMachineName?: string) => void;
      stopStateMachine: (stateMachineName?: string) => void;
      setInput: (stateMachineName: string, inputName: string, value: any) => void;
      setInputs: (stateMachineName: string, inputs: Record<string, any>) => void;
      fireState: (stateMachineName: string, state: string) => void;
      currentAnimations: string[];
      hasAnimations: boolean;
      canvas: HTMLCanvasElement | null;
    }
  }

  export function useRive(params: UseRiveParameters): UseRiveReturnType;
} 