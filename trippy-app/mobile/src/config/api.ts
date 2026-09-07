// React Native does not read process.env at runtime like Node does. After you
// deploy the backend (see trippy-app/SETUP.md), update these two URLs with the
// WebSocketUrl / HttpApiUrl values printed by `cdk deploy`.
export const API_CONFIG = {
  HTTP_API_URL: 'https://your-api.execute-api.us-east-1.amazonaws.com',
  WS_API_URL:
    'wss://your-ws-api.execute-api.us-east-1.amazonaws.com/production',
};

export const ENDPOINTS = {
  TRIPS: '/trips',
  PLAN_TRIP: (tripId: string) => `/trips/${tripId}/plan`,
  GET_TRIP: (tripId: string) => `/trips/${tripId}`,
};
