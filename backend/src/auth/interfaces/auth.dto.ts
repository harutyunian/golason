export class RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}
