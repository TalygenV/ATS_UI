
const getApiBaseUrl = () => {
    // In production, use the full API URL
    // You can override this with VITE_API_URL environment variable
    //return  'https://resumeparserats.netlify.app/api';
    //return 'https://resumeatsapi.netlify.app/api';
    //return 'http://localhost:3000/api';
    //return 'http://172.241.229.177:3536/api';
    return 'http://172.241.229.177:2526/api';
};

export const API_BASE_URL = getApiBaseUrl();