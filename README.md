# strapi-payload-model-migrator

Migrate models/components from Strapi V3 to Payload CMS.

## Usage

This repository should be cloned to run.

```shell
$ git clone acomagu/strapi-payload-model-migrator
$ cd strapi-payload-model-migrator
$ deno run -A ./gen.ts <strapi-directory>
$ deno run -A ./index.ts > <payload-directory>/src/collections/strapi-collections.json
```

I recommend to check `index.ts` for type errors after running `gen.ts`. You may have to rewrite or add transformation as you like.

Once the JSON is successfully generated, use it in `payload.config.ts`:

```typescript
import { buildConfig } from 'payload/config';
import { CollectionConfig } from 'payload/types';
import strapiCollections from './collections/strapi-collections.json';

export default buildConfig({
  collections: [
    ...strapiCollections as CollectionConfig[],
  ],
  ...
});
```
