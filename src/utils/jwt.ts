import { jwtDecode } from 'jwt-decode';

export type TokenPayload = {
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
};

export function decodeToken(token: string): TokenPayload {
  return jwtDecode<TokenPayload>(token);
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = decodeToken(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}
