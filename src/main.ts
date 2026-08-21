import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';

import { AppModule } from './app/app.module';

(window as any).katex = katex;
(window as any).renderMathInElement = renderMathInElement;

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
