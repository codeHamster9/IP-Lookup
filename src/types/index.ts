export interface IpApiResponse {
  status: 'success' | 'fail';
  country?: string;
  countryCode?: string;
  timezone?: string;
  query: string;
  message?: string;
}

export interface IpRowState {
  id: number;
  ip: string;
  loading: boolean;
  result?: IpApiResponse;
  error?: Error;
  isValid: boolean;
}

export type LookupStatus = 'idle' | 'loading' | 'success' | 'error';
