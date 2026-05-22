interface AirportInputProps {
    value: string;
    onChange: (iataCode: string) => void;
    /** Confirmed display text for the current value — parent owns this and swaps it */
    confirmedText: string;
    /** Called when user selects a suggestion, so parent can store the display label */
    onConfirm: (text: string) => void;
    placeholder?: string;
    label: string;
    error?: string;
}
export declare function AirportInput({ value: _value, onChange, confirmedText, onConfirm, placeholder, label, error, }: AirportInputProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AirportInput.d.ts.map