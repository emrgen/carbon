export const SERVICE_URL = import.meta.env.VITE_MODE === 'dev'
  ? 'http://localhost:8787/'
  : 'https://selo.minorblocker.workers.dev/';

// export const SERVICE_URL = 'https://selo.minorblocker.workers.dev/';

interface ToServiceUrlOpts {
  searchParams?: URLSearchParams;
}

// toServiceUrl converts a path to a full URL with the service URL
export const toServiceUrl = (path: string, opts: ToServiceUrlOpts = {}) => {

  if (opts.searchParams?.size) {
    return `${SERVICE_URL}${path}?${opts.searchParams.toString()}`;
  }

  return `${SERVICE_URL}${path}`;
}