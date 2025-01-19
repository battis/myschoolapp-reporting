import * as Endpoint from '../../Endpoint.js';
import { Payload } from './GetValidFileTypes/Payload.js';

export * from './GetValidFileTypes/Payload.js';
export * from './GetValidFileTypes/Response.js';

export const prepare: Endpoint.Prepare<Payload> = (payload, base?: string) =>
  Endpoint.prepare({
    payload,
    base,
    path: '/api/datadirect/GetValidFileTypes'
  });
