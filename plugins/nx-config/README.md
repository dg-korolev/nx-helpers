# `@nx-helpers/nx-config`

The Nx Plugin for parsing of module configurations in an NX tree

## Setting up the plugin

Adding the plugin to an existing Nx workspace can be done with the following:

```bash
npm install -D @nx-helpers/nx-config
```

```bash
yarn add -D @nx-helpers/nx-config
```

## Using the Container Plugin

### Configuring an application

It's straightforward to setup your application:

```bash
nx g @nx-helpers/nx-config:configuration
```

Or add target at project.json:

```json
{
  "targets": {
    "config-generator": {
      "executor": "@nx-helpers/nx-config:build",
      "options": {
        "envFileSnapshot": "snapshot.env",
        "buildDependenciesSnapshot": false,
        "syncEnv": true,
        "envFileToSync": "local.env"
      }
    }
  }
}
```

We can then build our application with the following command:

```bash
nx config-generator appName
```

## Example

#### Project tree:

```
...
project
  - apps
    - app-name-1
    - app-name-2
    ...
  - libs
    - user
      - db
      - cache
      ...
    - product
      - db
      - cache
      ...
    - common
      - cache-client (comon for `user/cache` and `product/cache`)
      - user-db-client
      - product-db-client
      ...
...
```

```ts
// libs/common/cache-client/cache-client.config-schema.ts
import * as Joi from 'joi';
import { registerConfigAs } from '@shared/helpers';

export type TCacheClientConfig = {
  host: string;
  port: number;
  password: string;
};

export const cacheClientConfigPath = 'cacheConfig';
export const cacheClientConfigScheme = registerConfigAs<TCacheClientConfig>({
  token: cacheClientConfigPath,
  schema: () => ({
    host: {
      value: process.env.CACHE_STORAGE_HOST,
      joi: Joi.string().min(1),
    },
    port: {
      value: Number(process.env.CACHE_STORAGE_PORT),
      joi: Joi.number(),
    },
    password: {
      value: process.env.CACHE_STORAGE_PASS,
      joi: Joi.string().allow('').optional(),
    },
  }),
});
```

```ts
// libs/common/user-db-client/user-db-client.config-schema.ts
// some configuration scheme for database client
```

```ts
// libs/common/product-db-client/product-db-client.config-schema.ts
// some configuration scheme for database client
```

#### Dependency diagram:

```
app-name-1 -> @user/cache -> @common/cache-client
app-name-1 -> @user/db -> @common/user-db-client

app-name-2 -> @product/cache -> @common/cache-client
app-name-2 -> @product/db -> @common/product-db-client
```

```env
-- libs/common/cache-client/generated.env
CACHE_STORAGE_HOST=
CACHE_STORAGE_PORT=
CACHE_STORAGE_PASS=
```

```env
-- libs/common/user-db-client/generated.env
USER_DB_URI=
```

```env
-- libs/common/product-db-client/generated.env
PRODUCT_DB_URI=
```

#### Run

```bash
nx run-many -t generate-env
```

#### Result

```env
-- apps/app-name-1/generated.env

# Project: 'app-name-1'
NODE_ENV=

# Project: 'cache-client'
CACHE_STORAGE_HOST=
CACHE_STORAGE_PORT=
CACHE_STORAGE_PASS=

# Project: 'user-db-client'
USER_DB_URI=

```

```env
-- apps/app-name-2/generated.env

# Project: 'app-name-2'
NODE_ENV=

# Project: 'cache-client'
CACHE_STORAGE_HOST=
CACHE_STORAGE_PORT=
CACHE_STORAGE_PASS=

# Project: 'product-db-client'
PRODUCT_DB_URI=

```
