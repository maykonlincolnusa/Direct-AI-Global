import { startApiServer } from './api/server';

const port = Number(process.env.DIRECT_PORT ?? 4300);
startApiServer(port);

// eslint-disable-next-line no-console
console.log(`DIRECT context platform running on port ${port}`);
