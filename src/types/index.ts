export interface IpApiResponse {
  status: 'success' | 'fail';
  message?: string;
  country: string;
  countryCode: string;
  timezone: string;
  query: string;
}

export interface IpRowState {
  id: string;
}
