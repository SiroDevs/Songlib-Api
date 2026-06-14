import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from './swaggerDef';

const router = Router();

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const SWAGGER_VERSION = '5.9.0';
const CSS_URL = `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_VERSION}/swagger-ui.min.css`;

const uiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'SongLib API Docs',
  
  customCssUrl: CSS_URL,
  customJs: [
    `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_VERSION}/swagger-ui-bundle.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_VERSION}/swagger-ui-standalone-preset.min.js`,
  ],
  
  customCss: `
    .swagger-ui .topbar { background-color: #373767; }
    .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><text y="22" font-size="20" font-weight="bold" fill="white">SongLib</text></svg>'); }
    .swagger-ui .info .title { color: #1a1a2e; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 16px; border-radius: 8px; }
  `,
  
  swaggerOptions: {
    persistAuthorization: true, 
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

router.get('/spec.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, uiOptions));

export default router;