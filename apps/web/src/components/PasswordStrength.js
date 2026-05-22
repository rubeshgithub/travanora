import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function getStrength(password) {
    if (!password)
        return 'weak';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isLong = password.length >= 12;
    const score = [hasUpper, hasLower, hasNumber, hasSpecial, isLong].filter(Boolean).length;
    if (password.length < 8 || score <= 2)
        return 'weak';
    if (score === 3)
        return 'fair';
    if (score === 4)
        return 'good';
    return 'strong';
}
const config = {
    weak: { bars: 1, color: 'bg-red-400', label: 'Weak' },
    fair: { bars: 2, color: 'bg-amber-400', label: 'Fair' },
    good: { bars: 3, color: 'bg-blue-400', label: 'Good' },
    strong: { bars: 4, color: 'bg-green', label: 'Strong' },
};
const textColor = {
    weak: 'text-red-500',
    fair: 'text-amber-500',
    good: 'text-blue-500',
    strong: 'text-green',
};
export function PasswordStrength({ password }) {
    if (!password)
        return null;
    const strength = getStrength(password);
    const { bars, color, label } = config[strength];
    return (_jsxs("div", { className: "mt-2", children: [_jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4].map((i) => (_jsx("div", { className: `h-1 flex-1 rounded-full transition-all duration-300 ${i <= bars ? color : 'bg-line'}` }, i))) }), _jsx("p", { className: `text-[12px] font-semibold mt-1 ${textColor[strength]}`, children: label })] }));
}
//# sourceMappingURL=PasswordStrength.js.map