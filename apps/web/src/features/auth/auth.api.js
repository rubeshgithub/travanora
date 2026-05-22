import { api } from '@/lib/api.js';
export async function register(input) {
    return api.post('/api/auth/register', input);
}
export async function login(input) {
    return api.post('/api/auth/login', input);
}
export async function logout() {
    return api.post('/api/auth/logout');
}
export async function forgotPassword(input) {
    return api.post('/api/auth/forgot-password', input);
}
//# sourceMappingURL=auth.api.js.map