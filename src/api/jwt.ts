interface JwtPayload {
  exp: number;
}

export function decodeJwtPayload(token: string): JwtPayload {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString()) as JwtPayload;
}
