export interface RegisterRequestBody {
  email: string;
  password: string;
  authMethod?: string;
}
interface GithubUserResponse {
  id: number;
  email: string;
  [key: string]: any;
}

interface AuthResponse {
  accessToken: string;
  message?: string;
  error?: string;
}
