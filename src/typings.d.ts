declare module 'katex/contrib/auto-render' {
  import { KatexOptions } from 'katex';

  interface AutoRenderOptions extends KatexOptions {
    delimiters?: { left: string; right: string; display: boolean }[];
    ignoredTags?: string[];
    ignoredClasses?: string[];
    errorCallback?: (msg: string, err: Error) => void;
  }

  export default function renderMathInElement(
    element: HTMLElement,
    options?: AutoRenderOptions
  ): void;
}
