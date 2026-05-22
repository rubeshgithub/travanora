import type { AuthResponse, LoginInput, RegisterInput, ForgotPasswordInput } from '@travanora/shared';
export declare function register(input: RegisterInput): Promise<AuthResponse>;
export declare function login(input: LoginInput): Promise<AuthResponse>;
export declare function logout(): Promise<void>;
export declare function forgotPassword(input: ForgotPasswordInput): Promise<{
    ok: boolean;
    message: string;
}>;
//# sourceMappingURL=auth.api.d.ts.map