import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const traceExporter = new OTLPTraceExporter({
  url: process.env.GRAFANA_TEMPO_ENDPOINT, 
  headers: {
    Authorization: `Basic ${Buffer.from(`${process.env.GRAFANA_TEMPO_USER}:${process.env.GRAFANA_API_TOKEN}`).toString('base64')}`
  }
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()] 
});

sdk.start();
console.log('🕵️ OpenTelemetry Tracing initialized');