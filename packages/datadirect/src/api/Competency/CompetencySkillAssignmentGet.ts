import * as Endpoint from '../../Endpoint.js';
import { Payload } from './CompetencySkillAssignmentGet/Payload.js';

export * from './CompetencySkillAssignmentGet/Payload.js';
export * from './CompetencySkillAssignmentGet/Response.js';

export const prepare: Endpoint.Prepare<Payload> = (payload, base?: string) =>
  Endpoint.prepare({
    payload,
    base,
    path: '/api/Comptency/CompetencySkillAssignmentGet'
  });
