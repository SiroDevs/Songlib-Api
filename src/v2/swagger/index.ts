import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from './swaggerDef';

const router = Router();

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const uiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'SongLib API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><text y="22" font-size="20" font-weight="bold" fill="white">SongLib</text></svg>'); }
    .swagger-ui .info .title { color: #1a1a2e; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 16px; border-radius: 8px; }
  `,
  swaggerOptions: {
    persistAuthorization: true,   // keep the API key filled in between page reloads
    displayRequestDuration: true, // show how long each request took
    filter: true,                 // enable tag filtering
    tryItOutEnabled: true,        // open "Try it out" by default
  },
};

router.get('/spec.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, uiOptions));

export default router;
