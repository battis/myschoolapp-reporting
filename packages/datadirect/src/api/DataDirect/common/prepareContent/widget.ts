import * as Endpoint from '../../../Endpoint.js';
import { Payload } from '../ContentItem.js';

export function widget() {
  return (payload: Payload, base?: string) => {
    if (!payload.contextValue) {
      throw new Error(
        `contextValue must be set (usually to the group or section ID)`
      );
    }
    return Endpoint.prepare({
      payload,
      base,
      path: `/api/widget/WidgetGet/`
    });
  };
}
