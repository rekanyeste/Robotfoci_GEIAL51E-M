import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { Field } from './app/components/field/field';

bootstrapApplication(Field, {
  providers: [provideHttpClient()],
}).catch((err) => console.error(err));
