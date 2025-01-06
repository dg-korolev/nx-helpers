import { createCustomRunner, CustomRunnerOptions, initEnv, RemoteCacheImplementation } from 'nx-remotecache-custom';
import { commandOptions, createClient } from 'redis';
import { Readable } from 'stream';

interface RedisRunnerOptions {
  url?: string;
  expire?: number;
}

const ENV_REDIS_URL = 'NX_CACHE_REDIS_URL';
const ENV_REDIS_EXPIRE = 'NX_CACHE_REDIS_EXPIRE';

const getRedisClient = async (options: CustomRunnerOptions<RedisRunnerOptions>) => {
  const redisUrl = process.env[ENV_REDIS_URL] || options.url;
  const redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 240_000,
      timeout: 240_000,
    },
  });

  redisClient.on('error', (err: Error) => {
    console.log(`Nx-cloud redis error: '${err.name}'.`);
  });
  redisClient.on('close', () => {
    console.log(`Nx-cloud redis closed.`);
  });

  await redisClient.connect();

  return redisClient;
};

export default createCustomRunner<RedisRunnerOptions>(async (options): Promise<RemoteCacheImplementation> => {
  initEnv(options);
  const client = await getRedisClient(options);
  return {
    name: 'Redis',
    fileExists: async (key: string): Promise<boolean> => {
      try {
        return !!(await client.exists(key));
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
      } catch (err: Error) {
        err.message = `[NX:fileExists] ${err.message}`;
        throw err;
      }
    },
    retrieveFile: async (key: string): Promise<NodeJS.ReadableStream> => {
      try {
        // eslint-disable-next-line no-async-promise-executor
        return await new Promise<NodeJS.ReadableStream>(async (resolve, reject) => {
          const data = await client.get(commandOptions({ returnBuffers: true }), key);
          if (data) {
            resolve(Readable.from(data as Buffer));
          } else {
            reject();
          }
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
      } catch (err: Error) {
        err.message = `[NX:retrieveFile] ${err.message}`;
        throw err;
      }
    },
    storeFile: async (key: string, data: Readable): Promise<void> => {
      try {
        const buffer = await getBufferFromStream(data);

        await client.set(key, buffer);

        const expire = process.env[ENV_REDIS_EXPIRE] || options.expire;

        if (expire && !!parseInt(String(expire))) {
          await client.expire(key, Number(expire));
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
      } catch (err: Error) {
        err.message = `[NX:storeFile] ${err.message}`;
        throw err;
      }
    },
  };
});

async function getBufferFromStream(stream: Readable): Promise<Buffer> {
  return new Promise((r, j) => {
    let buffer = Buffer.from([]);
    stream.on('data', (buf) => {
      buffer = Buffer.concat([buffer, buf]);
    });
    stream.on('end', () => r(buffer));
    stream.on('error', j);
  });
}
