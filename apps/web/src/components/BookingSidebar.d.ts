interface SidebarSlice {
    origin: string;
    originName?: string;
    destination: string;
    destinationName?: string;
    departureAt: string;
    arrivalAt: string;
    durationMinutes?: number;
    stops?: number;
}
export interface BookingSidebarProps {
    slices: SidebarSlice[];
    airline: string;
    airlineCode: string;
    cabinClass?: string;
    publicPrice: number;
    memberDiscount: number;
    totalAmount: number;
    currency: string;
    discountPercent: number;
    passengerCount?: number;
    expiresAt?: string | Date;
}
export declare function BookingSidebar({ slices, airline, airlineCode, cabinClass, publicPrice, memberDiscount, totalAmount, currency, discountPercent, passengerCount, expiresAt, }: BookingSidebarProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=BookingSidebar.d.ts.map