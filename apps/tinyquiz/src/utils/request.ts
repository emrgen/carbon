import {toServiceUrl} from "@/service_url.ts";

export const createEntity = async <T>(url: string,data: T) => {
  return fetch(toServiceUrl(url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((res) => res.json())
}


export const updateEntity = async <T>(url: string, data: T) => {
  return fetch(toServiceUrl(url), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((res) => res.json())
}