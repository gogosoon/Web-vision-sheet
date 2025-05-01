// import dotenv from 'dotenv'
// dotenv.config()
// in production build .env is not loaded properly
// const web_app_url = process.env.VITE_WEB_APP_URL;
const web_app_url = "https://spreadsheetflow.com";
console.log('web_app_url', web_app_url);
export const CONST_ELECTON_APP = {
    APP_PROTOCOL: 'spreadsheetflow',
    WEB_APP_URL: web_app_url,
    API_URL: `${web_app_url}/api`,
    VALIDATE_TOKEN_ENDPOINT: `${web_app_url}/api/auth/validate-desktop-token`
}