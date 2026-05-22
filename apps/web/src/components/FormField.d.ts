import { type InputHTMLAttributes, type ReactNode } from 'react';
interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
    suffix?: ReactNode;
}
export declare const FormField: import("react").ForwardRefExoticComponent<FormFieldProps & import("react").RefAttributes<HTMLInputElement>>;
export {};
//# sourceMappingURL=FormField.d.ts.map