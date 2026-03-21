import { app } from './app.js';
import { config } from './config.js';

app.listen(config.PORT, () => {
  console.log(`SyntroPass API running on port ${config.PORT}`);
});
