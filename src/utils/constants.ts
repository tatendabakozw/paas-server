export const PROJECT_NAME = "quickops"
export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret";
export const REFRESH_TOKEN_EXPIRY = "7d"; // Refresh token lifespan
export const ACCESS_TOKEN_EXPIRY = "15m"; // Access token lifespan

export const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key";
export const PORT = process.env.PORT || 5500;
export const BACKEND_URL = process.env.BACKEND_URL ||'http://localhost:5500'
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

export const GITHUB_CALLBACK_URL= process.env.GITHUB_CALLBACK_URL || "http://localhost:5500/api/auth/github/callback"
export const GITHUB_HOMEPAGE_URL= process.env.GITHUB_HOMEPAGE_URL || "http://localhost:5500/"
export const GITHUB_CLIENT_ID= process.env.GITHUB_CLIENT_ID || "github_client_id"
export const GITHUB_CLIENT_SECRET=process.env.GITHUB_CLIENT_SECRET || "github_client_secret"
export const GITHUB_API_URL = "https://api.github.com"


export const ECR_REPO_NAME = process.env.ECR_REPO_NAME || "paas-ecr-repo"
export const ECS_CLUSTER_NAME = process.env.ECS_CLUSTER_NAME || "paas-cluster"

export const DIGITALOCEAN_TOKEN = process.env.DIGITALOCEAN_TOKEN || "notoken"



