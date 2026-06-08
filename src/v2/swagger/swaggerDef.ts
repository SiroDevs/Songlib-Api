import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SongLib API',
      version: '2.0.0',
      description: `
This is the current version — it adds authentication, rate limiting, pagination, per-user likes, song error reporting, and a health check endpoint. All v1 routes remain available at \`/api/...\` unchanged.

### Authentication
Write operations (POST, PUT, DELETE) require an API key in the request header:
\`\`\`
x-api-key: your-secret-key
\`\`\`
GET requests are public and do not require a key.

### Rate Limits
| Tier | Limit | Window |
|------|-------|--------|
| Read (GET) | 300 requests | 15 min |
| Write (POST/PUT/DELETE) | 60 requests | 15 min |
| Bulk operations | 10 requests | 15 min |
      `,
      contact: {
        name: '@SiroDevs',
        url: 'https://sirodevs.vercel.app',
      },
    },
    servers: [
      {
        url: 'https://songlive.vercel.app/api/v2',
        description: 'Production',
      },
      {
        url: 'http://localhost:4000/api/v2',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Required for all write operations (POST, PUT, DELETE)',
        },
      },
      schemas: {
        // ── Core entities ──────────────────────────────────────────────────
        Book: {
          type: 'object',
          required: ['title', 'subTitle'],
          properties: {
            bookId:    { type: 'integer', example: 1,            description: 'Auto-assigned unique ID' },
            title:     { type: 'string',  example: 'Nyimbo za Injili', description: 'Full songbook name' },
            subTitle:  { type: 'string',  example: 'NZI',        description: 'Short code or subtitle' },
            italics:   { type: 'string',  example: 'Swahili',    description: 'Language or style label' },
            enabled:   { type: 'boolean', example: true },
            created:   { type: 'string',  format: 'date-time',   example: '2024-01-01T00:00:00Z' },
            updated:   { type: 'string',  format: 'date-time',   example: '2024-06-01T00:00:00Z' },
          },
        },

        Song: {
          type: 'object',
          required: ['book', 'songNo', 'title'],
          properties: {
            songId:  { type: 'integer', example: 101,           description: 'Auto-assigned unique ID' },
            book:    { type: 'integer', example: 1,             description: 'ID of the parent book' },
            songNo:  { type: 'integer', example: 42,            description: 'Song number within the book' },
            title:   { type: 'string',  example: 'Amazing Grace' },
            alias:   { type: 'string',  example: 'Neema ya Ajabu', description: 'Alternate title or translation' },
            content: { type: 'string',  example: 'Amazing grace how sweet the sound...' },
            key:     { type: 'string',  example: 'G',           description: 'Musical key' },
            author:  { type: 'string',  example: 'John Newton' },
            views:   { type: 'integer', example: 150 },
            likes:   { type: 'integer', example: 34,            description: 'Aggregate like count across all users' },
            created: { type: 'string',  format: 'date-time' },
            updated: { type: 'string',  format: 'date-time' },
          },
        },

        User: {
          type: 'object',
          required: ['username'],
          properties: {
            userId:   { type: 'integer', example: 1 },
            username: { type: 'string',  example: 'siro_dev' },
            email:    { type: 'string',  example: 'siro@example.com' },
            phone:    { type: 'string',  example: '+254700000000' },
            created:  { type: 'string',  format: 'date-time' },
            updated:  { type: 'string',  format: 'date-time' },
          },
        },

        Draft: {
          type: 'object',
          required: ['title'],
          properties: {
            draftId:  { type: 'integer', example: 1 },
            book:     { type: 'integer', example: 1 },
            songNo:   { type: 'integer', example: 99 },
            title:    { type: 'string',  example: 'My new worship song' },
            alias:    { type: 'string' },
            content:  { type: 'string' },
            key:      { type: 'string',  example: 'C' },
            author:   { type: 'string' },
            created:  { type: 'string',  format: 'date-time' },
            updated:  { type: 'string',  format: 'date-time' },
          },
        },

        Edit: {
          type: 'object',
          required: ['title'],
          properties: {
            editId:   { type: 'integer', example: 1 },
            songId:   { type: 'integer', example: 42,  description: 'Original song being edited' },
            book:     { type: 'integer', example: 1 },
            songNo:   { type: 'integer', example: 42 },
            title:    { type: 'string',  example: 'Amazing Grace (corrected)' },
            content:  { type: 'string' },
            created:  { type: 'string',  format: 'date-time' },
            updated:  { type: 'string',  format: 'date-time' },
          },
        },

        Listing: {
          type: 'object',
          required: ['title'],
          properties: {
            listingId: { type: 'integer', example: 1 },
            parentId:  { type: 'integer', example: 1,  description: 'Groups related listing entries' },
            title:     { type: 'string',  example: 'Sunday Service — June 2025' },
            song:      { type: 'integer', example: 42, description: 'songId of the song in this listing entry' },
            created:   { type: 'string',  format: 'date-time' },
            updated:   { type: 'string',  format: 'date-time' },
          },
        },

        Organisation: {
          type: 'object',
          required: ['title'],
          properties: {
            orgId:    { type: 'integer', example: 1 },
            title:    { type: 'string',  example: 'PCEA Nairobi Central' },
            subTitle: { type: 'string',  example: 'Choir' },
            email:    { type: 'string',  example: 'choir@pcea.or.ke' },
            phone:    { type: 'string',  example: '+254700000000' },
            created:  { type: 'string',  format: 'date-time' },
            updated:  { type: 'string',  format: 'date-time' },
          },
        },

        UserLike: {
          type: 'object',
          properties: {
            userId:    { type: 'integer', example: 1 },
            songId:    { type: 'integer', example: 42 },
            createdAt: { type: 'string',  format: 'date-time' },
          },
        },

        SongReport: {
          type: 'object',
          required: ['songId', 'bookId', 'songNo', 'songTitle', 'reportType', 'description'],
          properties: {
            reportId:    { type: 'integer', example: 1 },
            songId:      { type: 'integer', example: 42 },
            bookId:      { type: 'integer', example: 1 },
            songNo:      { type: 'integer', example: 42 },
            songTitle:   { type: 'string',  example: 'Amazing Grace' },
            reportType: {
              type: 'string',
              enum: ['typo', 'missing_verse', 'wrong_song', 'wrong_number', 'other'],
              example: 'typo',
            },
            description: { type: 'string',  example: 'Verse 2 has a spelling error in line 3' },
            reportedBy:  { type: 'string',  example: 'device_abc123', description: 'Optional device/user identifier' },
            resolved:    { type: 'boolean', example: false },
            createdAt:   { type: 'string',  format: 'date-time' },
          },
        },

        // ── Utility schemas ────────────────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 500 },
            total:      { type: 'integer', example: 1240 },
            totalPages: { type: 'integer', example: 3 },
            hasMore:    { type: 'boolean', example: true },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            status:  { type: 'integer', example: 400 },
            error:   { type: 'string',  example: 'title is required' },
            details: { type: 'string',  example: 'Additional context if available' },
          },
        },

        BulkResult: {
          type: 'object',
          properties: {
            status:  { type: 'integer', example: 201 },
            message: { type: 'string',  example: '150 songs processed successfully' },
            count:   { type: 'integer', example: 150 },
            results: { type: 'array',   items: {} },
            errors:  { type: 'array',   items: {}, description: 'Only present when some items failed' },
          },
        },
      },

      // ── Reusable parameters ─────────────────────────────────────────────
      parameters: {
        pageParam: {
          in: 'query', name: 'page', schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Page number',
        },
        limitParam: {
          in: 'query', name: 'limit', schema: { type: 'integer', default: 500, minimum: 1, maximum: 1000 },
          description: 'Results per page (max 1000)',
        },
        sinceParam: {
          in: 'query', name: 'since', schema: { type: 'string', format: 'date-time' },
          description: 'Delta sync — returns only records updated after this ISO timestamp',
          example: '2025-01-01T00:00:00Z',
        },
      },

      // ── Reusable responses ──────────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'Missing or invalid API key',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        BadRequest: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Conflict: {
          description: 'Duplicate record',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ServerError: {
          description: 'Internal server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },

    tags: [
      { name: 'Health',        description: 'Server and database status' },
      { name: 'Books',         description: 'Songbook management' },
      { name: 'Songs',         description: 'Song management, search, and likes' },
      { name: 'Users',         description: 'User management' },
      { name: 'Drafts',        description: 'User-composed song drafts' },
      { name: 'Edits',         description: 'Proposed corrections to existing songs' },
      { name: 'Listings',      description: 'Custom song playlists / worship sets' },
      { name: 'Organisations', description: 'Church or choir organisations' },
      { name: 'Reports',       description: 'Song error reporting' },
    ],

    paths: {
      // ── Health ──────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Server and database status',
          description: 'Returns the live status of the API server and its MongoDB connection. Safe for uptime monitors.',
          responses: {
            200: {
              description: 'Healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status:   { type: 'integer', example: 200 },
                      api:      { type: 'string',  example: 'v2' },
                      server:   { type: 'string',  example: 'ok' },
                      database: { type: 'string',  example: 'connected', enum: ['connected', 'disconnected', 'connecting', 'disconnecting'] },
                      timestamp: { type: 'string', format: 'date-time' },
                      uptime:   { type: 'integer', example: 3600, description: 'Server uptime in seconds' },
                    },
                  },
                },
              },
            },
            503: { description: 'Unhealthy — database not connected' },
          },
        },
      },

      // ── Books ────────────────────────────────────────────────────────────
      '/books': {
        get: {
          tags: ['Books'],
          summary: 'Get all enabled books',
          description: 'Returns all songbooks marked as enabled, sorted by bookNo.',
          responses: {
            200: { description: 'List of books', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Book' } } } } },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
        post: {
          tags: ['Books'],
          summary: 'Create one or many books',
          description: 'Pass a single book object or an array for bulk creation. bookId is auto-assigned.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Book' },
                    { type: 'array', items: { $ref: '#/components/schemas/Book' } },
                  ],
                },
                examples: {
                  single: { summary: 'Single book', value: { title: 'Songs of Worship', subTitle: 'SOW', italics: 'English', enabled: true } },
                  bulk:   { summary: 'Bulk create', value: [{ title: 'Nyimbo za Injili', subTitle: 'NZI', italics: 'Swahili', enabled: true }, { title: 'Tenzi za Rohoni', subTitle: 'TZR', italics: 'Swahili', enabled: true }] },
                },
              },
            },
          },
          responses: {
            201: { description: 'Book(s) created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
        put: {
          tags: ['Books'],
          summary: 'Update one or many books',
          description: 'Pass a single book object (with bookId) or an array for bulk updates.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Book' },
                    { type: 'array', items: { $ref: '#/components/schemas/Book' } },
                  ],
                },
                examples: {
                  single: { summary: 'Update single', value: { bookId: 1, title: 'Nyimbo za Injili (Updated)', subTitle: 'NZI', enabled: true } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Book(s) updated' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/books/{ids}': {
        get: {
          tags: ['Books'],
          summary: 'Get books by IDs',
          parameters: [{ in: 'path', name: 'ids', required: true, schema: { type: 'string' }, description: 'Comma-separated book IDs', example: '1,2,3' }],
          responses: {
            200: { description: 'Matching books', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Book' } } } } },
            400: { $ref: '#/components/responses/BadRequest' },
          },
        },
        delete: {
          tags: ['Books'],
          summary: 'Delete a book',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'ids', required: true, schema: { type: 'integer' }, description: 'bookId to delete', example: 1 }],
          responses: {
            200: { description: 'Deleted successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ── Songs ────────────────────────────────────────────────────────────
      '/songs': {
        post: {
          tags: ['Songs'],
          summary: 'Create one or many songs',
          description: 'Pass a single song object or an array for bulk creation. songId is auto-assigned. Uniqueness is enforced on the **(book, songNo)** pair — not globally on title.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Song' },
                    { type: 'array', items: { $ref: '#/components/schemas/Song' } },
                  ],
                },
                examples: {
                  single: { summary: 'Single song', value: { book: 1, songNo: 1, title: 'Amazing Grace', content: 'Amazing grace how sweet the sound...', author: 'John Newton', key: 'G' } },
                  bulk:   { summary: 'Bulk create', value: [{ book: 1, songNo: 1, title: 'Amazing Grace', content: '...' }, { book: 1, songNo: 2, title: 'How Great Thou Art', content: '...' }] },
                },
              },
            },
          },
          responses: {
            201: { description: 'Song(s) created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
        put: {
          tags: ['Songs'],
          summary: 'Update one or many songs',
          description: 'Fixed v1 bug: v1 had two `PUT /` handlers — the second was unreachable. Now a single handler covers both single and bulk updates.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Song' },
                    { type: 'array', items: { $ref: '#/components/schemas/Song' } },
                  ],
                },
              },
            },
          },
          responses: {
            200: { description: 'Song(s) updated' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/songs/books/{bookIds}': {
        get: {
          tags: ['Songs'],
          summary: 'Get songs by book IDs',
          description: 'Fetch songs for one or more books. Supports pagination and delta sync via `?since`. The Android WorkManager sync should use `?since=<last_sync_timestamp>` on background syncs to fetch only changed songs.',
          parameters: [
            { in: 'path', name: 'bookIds', required: true, schema: { type: 'string' }, description: 'Comma-separated book IDs', example: '1,2,3' },
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
            { $ref: '#/components/parameters/sinceParam' },
          ],
          responses: {
            200: {
              description: 'Paginated songs',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data:       { type: 'array', items: { $ref: '#/components/schemas/Song' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
            404: { $ref: '#/components/responses/NotFound' },
            429: { $ref: '#/components/responses/TooManyRequests' },
          },
        },
      },

      '/songs/{songId}': {
        get: {
          tags: ['Songs'],
          summary: 'Get a single song by ID',
          parameters: [{ in: 'path', name: 'songId', required: true, schema: { type: 'integer' }, example: 42 }],
          responses: {
            200: { description: 'Song found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Song' } } } },
            400: { $ref: '#/components/responses/BadRequest' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Songs'],
          summary: 'Delete a song',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'songId', required: true, schema: { type: 'integer' }, example: 42 }],
          responses: {
            200: { description: 'Deleted successfully' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      '/songs/likes/toggle': {
        post: {
          tags: ['Songs'],
          summary: 'Toggle a like for a user on a song',
          description: 'Idempotent — call again to unlike. Increments or decrements the song\'s aggregate `likes` counter. Replaces the broken global `liked: boolean` from v1.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'songId'],
                  properties: {
                    userId: { type: 'integer', example: 1 },
                    songId: { type: 'integer', example: 42 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Like toggled',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      liked: { type: 'boolean', example: true, description: 'The new like state after toggle' },
                    },
                  },
                  examples: {
                    liked:   { summary: 'After liking',   value: { liked: true } },
                    unliked: { summary: 'After unliking', value: { liked: false } },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/songs/likes/{userId}': {
        get: {
          tags: ['Songs'],
          summary: 'Get all song IDs liked by a user',
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: {
            200: {
              description: 'Liked song IDs',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      userId:       { type: 'integer', example: 1 },
                      likedSongIds: { type: 'array', items: { type: 'integer' }, example: [42, 77, 103] },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
          },
        },
      },

      // ── Users ────────────────────────────────────────────────────────────
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Get all users',
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'List of users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } },
        },
        post: {
          tags: ['Users'],
          summary: 'Create a user',
          security: [{ ApiKeyAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/User' }, example: { username: 'siro_dev', email: 'siro@example.com', phone: '+254700000000' } } } },
          responses: {
            201: { description: 'User created' },
            400: { $ref: '#/components/responses/BadRequest' },
            401: { $ref: '#/components/responses/Unauthorized' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
      },

      '/users/{userId}': {
        get: {
          tags: ['Users'],
          summary: 'Get a user by ID',
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: {
            200: { description: 'User found', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Update a user',
          description: 'Fixed v1 bug: v1 used `POST /:userId` for updates. Now correctly uses `PUT`.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          responses: {
            200: { description: 'User updated' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete a user',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: {
            200: { description: 'User deleted' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ── Drafts ───────────────────────────────────────────────────────────
      '/drafts': {
        get: {
          tags: ['Drafts'],
          summary: 'Get all drafts',
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'List of drafts', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Draft' } } } } } },
        },
        post: {
          tags: ['Drafts'],
          summary: 'Create a draft',
          security: [{ ApiKeyAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Draft' } } } },
          responses: { 201: { description: 'Draft created' }, 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },

      '/drafts/{draftId}': {
        get: {
          tags: ['Drafts'],
          summary: 'Get a draft by ID',
          parameters: [{ in: 'path', name: 'draftId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Draft found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Draft' } } } }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        put: {
          tags: ['Drafts'],
          summary: 'Update a draft',
          description: 'Fixed v1 bug: v1 used `POST /:draftId` for updates.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'draftId', required: true, schema: { type: 'integer' }, example: 1 }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Draft' } } } },
          responses: { 200: { description: 'Draft updated' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        delete: {
          tags: ['Drafts'],
          summary: 'Delete a draft',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'draftId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Draft deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      },

      // ── Edits ────────────────────────────────────────────────────────────
      '/edits': {
        get: {
          tags: ['Edits'],
          summary: 'Get all edits',
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'List of edits', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Edit' } } } } } },
        },
        post: {
          tags: ['Edits'],
          summary: 'Create an edit',
          security: [{ ApiKeyAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Edit' } } } },
          responses: { 201: { description: 'Edit created' }, 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },

      '/edits/{editId}': {
        get: {
          tags: ['Edits'],
          summary: 'Get an edit by ID',
          parameters: [{ in: 'path', name: 'editId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Edit found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Edit' } } } }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        put: {
          tags: ['Edits'],
          summary: 'Update an edit',
          description: 'Fixed v1 bug: v1 used `POST /:editId` for updates.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'editId', required: true, schema: { type: 'integer' }, example: 1 }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Edit' } } } },
          responses: { 200: { description: 'Edit updated' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        delete: {
          tags: ['Edits'],
          summary: 'Delete an edit',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'editId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Edit deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      },

      // ── Listings ─────────────────────────────────────────────────────────
      '/listings': {
        get: {
          tags: ['Listings'],
          summary: 'Get all listings',
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'List of listings', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Listing' } } } } } },
        },
        post: {
          tags: ['Listings'],
          summary: 'Create a listing entry',
          security: [{ ApiKeyAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' }, example: { title: 'Sunday Service', parentId: 1, song: 42 } } } },
          responses: { 201: { description: 'Listing created' }, 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },

      '/listings/{listingId}': {
        get: {
          tags: ['Listings'],
          summary: 'Get a listing by ID',
          parameters: [{ in: 'path', name: 'listingId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Listing found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } } }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        put: {
          tags: ['Listings'],
          summary: 'Update a listing entry',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'listingId', required: true, schema: { type: 'integer' }, example: 1 }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } } },
          responses: { 200: { description: 'Listing updated' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        delete: {
          tags: ['Listings'],
          summary: 'Delete a listing entry',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'listingId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Listing deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      },

      // ── Organisations ────────────────────────────────────────────────────
      '/organisations': {
        get: {
          tags: ['Organisations'],
          summary: 'Get all organisations',
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'List of organisations', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Organisation' } } } } } },
        },
        post: {
          tags: ['Organisations'],
          summary: 'Create an organisation',
          security: [{ ApiKeyAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Organisation' } } } },
          responses: { 201: { description: 'Organisation created' }, 400: { $ref: '#/components/responses/BadRequest' }, 401: { $ref: '#/components/responses/Unauthorized' } },
        },
      },

      '/organisations/{orgId}': {
        get: {
          tags: ['Organisations'],
          summary: 'Get an organisation by ID',
          parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Organisation found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organisation' } } } }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        put: {
          tags: ['Organisations'],
          summary: 'Update an organisation',
          description: 'Fixed v1 bug: v1 used `POST /:orgId` for updates.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'integer' }, example: 1 }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Organisation' } } } },
          responses: { 200: { description: 'Organisation updated' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
        delete: {
          tags: ['Organisations'],
          summary: 'Delete an organisation',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'integer' }, example: 1 }],
          responses: { 200: { description: 'Organisation deleted' }, 401: { $ref: '#/components/responses/Unauthorized' }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      },

      // ── Reports ──────────────────────────────────────────────────────────
      '/reports': {
        post: {
          tags: ['Reports'],
          summary: 'Submit a song error report',
          description: 'Allows app users to flag song errors (typos, missing verses, wrong numbers). No API key required — open to all users.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SongReport' },
                example: {
                  songId: 42,
                  bookId: 1,
                  songNo: 42,
                  songTitle: 'Amazing Grace',
                  reportType: 'typo',
                  description: 'Verse 2, line 3 has "teh" instead of "the"',
                  reportedBy: 'device_abc123',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Report submitted',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { message: { type: 'string', example: 'Report submitted. Thank you for helping improve SongLib!' }, reportId: { type: 'integer', example: 7 } } },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
          },
        },
        get: {
          tags: ['Reports'],
          summary: 'List all reports (admin)',
          description: 'Requires API key. Filter by resolution status.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'query', name: 'resolved', schema: { type: 'boolean' }, description: 'Filter by resolution status. Omit to get all.', example: false }],
          responses: {
            200: { description: 'List of reports', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/SongReport' } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },

      '/reports/{reportId}/resolve': {
        put: {
          tags: ['Reports'],
          summary: 'Mark a report as resolved (admin)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ in: 'path', name: 'reportId', required: true, schema: { type: 'integer' }, example: 7 }],
          responses: {
            200: { description: 'Report resolved' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
    },
  },
  apis: [],
};
