// api/types/fastify-metrics.d.ts
import { FastifyPluginCallback } from 'fastify';
import * as client from 'prom-client';

declare module 'fastify-metrics' {
  interface FastifyMetricsOptions {
    endpoint?: string;
    clearRegisterOnInit?: boolean;
    enableDefaultMetrics?: boolean;
    enableRouteMetrics?: boolean;
    promClient?: typeof client;
    // Add other options as needed from the docs
  }

  const fastifyMetrics: FastifyPluginCallback<FastifyMetricsOptions>;
  export default fastifyMetrics;
}

declare module 'fastify' {
  interface FastifyInstance {
    metrics: {
      client: typeof client;
    };
  }
}
