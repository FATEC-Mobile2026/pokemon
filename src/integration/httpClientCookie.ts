import axios from 'axios';

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandlerCookie(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

export function createApiCookie(baseURL: string) {
  const instance = axios.create({ baseURL, withCredentials: true });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        onUnauthorized?.();
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
