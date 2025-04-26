// Web app URL and API endpoints
export const WEB_APP_URL = 'http://localhost:3000' // Replace with your actual domain
export const API_URL = `${WEB_APP_URL}/api`

// Custom protocol for deep linking
export const APP_PROTOCOL = 'glintify'

// Auth-related URLs
export const DESKTOP_LOGIN_URL = `${WEB_APP_URL}/desktop-login`
export const AUTH_CALLBACK_URL = `${APP_PROTOCOL}://auth-callback`

// API endpoints
export const VALIDATE_TOKEN_ENDPOINT = `${API_URL}/auth/validate-desktop-token` 