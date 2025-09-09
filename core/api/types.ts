// Shared API types

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type FieldError = {
  field: string;
  message: string;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: FieldError[];
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type LoginData = {
  user: User;
  token: string;
  tokenType: 'Bearer';
};

export type ProfileData = {
  user: User;
};

export type RegisterData = {
  user: User;
};

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
