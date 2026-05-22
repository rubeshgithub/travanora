import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+93', flag: '🇦🇫', label: 'Afghanistan' },
  { code: '+355', flag: '🇦🇱', label: 'Albania' },
  { code: '+213', flag: '🇩🇿', label: 'Algeria' },
  { code: '+376', flag: '🇦🇩', label: 'Andorra' },
  { code: '+244', flag: '🇦🇴', label: 'Angola' },
  { code: '+1268', flag: '🇦🇬', label: 'Antigua & Barbuda' },
  { code: '+54', flag: '🇦🇷', label: 'Argentina' },
  { code: '+374', flag: '🇦🇲', label: 'Armenia' },
  { code: '+61', flag: '🇦🇺', label: 'Australia' },
  { code: '+43', flag: '🇦🇹', label: 'Austria' },
  { code: '+994', flag: '🇦🇿', label: 'Azerbaijan' },
  { code: '+1242', flag: '🇧🇸', label: 'Bahamas' },
  { code: '+973', flag: '🇧🇭', label: 'Bahrain' },
  { code: '+880', flag: '🇧🇩', label: 'Bangladesh' },
  { code: '+1246', flag: '🇧🇧', label: 'Barbados' },
  { code: '+375', flag: '🇧🇾', label: 'Belarus' },
  { code: '+32', flag: '🇧🇪', label: 'Belgium' },
  { code: '+501', flag: '🇧🇿', label: 'Belize' },
  { code: '+229', flag: '🇧🇯', label: 'Benin' },
  { code: '+975', flag: '🇧🇹', label: 'Bhutan' },
  { code: '+591', flag: '🇧🇴', label: 'Bolivia' },
  { code: '+387', flag: '🇧🇦', label: 'Bosnia & Herzegovina' },
  { code: '+267', flag: '🇧🇼', label: 'Botswana' },
  { code: '+55', flag: '🇧🇷', label: 'Brazil' },
  { code: '+673', flag: '🇧🇳', label: 'Brunei' },
  { code: '+359', flag: '🇧🇬', label: 'Bulgaria' },
  { code: '+226', flag: '🇧🇫', label: 'Burkina Faso' },
  { code: '+257', flag: '🇧🇮', label: 'Burundi' },
  { code: '+238', flag: '🇨🇻', label: 'Cape Verde' },
  { code: '+855', flag: '🇰🇭', label: 'Cambodia' },
  { code: '+237', flag: '🇨🇲', label: 'Cameroon' },
  { code: '+1', flag: '🇨🇦', label: 'Canada' },
  { code: '+236', flag: '🇨🇫', label: 'Central African Republic' },
  { code: '+235', flag: '🇹🇩', label: 'Chad' },
  { code: '+56', flag: '🇨🇱', label: 'Chile' },
  { code: '+86', flag: '🇨🇳', label: 'China' },
  { code: '+57', flag: '🇨🇴', label: 'Colombia' },
  { code: '+269', flag: '🇰🇲', label: 'Comoros' },
  { code: '+242', flag: '🇨🇬', label: 'Congo' },
  { code: '+243', flag: '🇨🇩', label: 'Congo (DR)' },
  { code: '+506', flag: '🇨🇷', label: 'Costa Rica' },
  { code: '+385', flag: '🇭🇷', label: 'Croatia' },
  { code: '+53', flag: '🇨🇺', label: 'Cuba' },
  { code: '+357', flag: '🇨🇾', label: 'Cyprus' },
  { code: '+420', flag: '🇨🇿', label: 'Czech Republic' },
  { code: '+45', flag: '🇩🇰', label: 'Denmark' },
  { code: '+253', flag: '🇩🇯', label: 'Djibouti' },
  { code: '+1767', flag: '🇩🇲', label: 'Dominica' },
  { code: '+1809', flag: '🇩🇴', label: 'Dominican Republic' },
  { code: '+593', flag: '🇪🇨', label: 'Ecuador' },
  { code: '+20', flag: '🇪🇬', label: 'Egypt' },
  { code: '+503', flag: '🇸🇻', label: 'El Salvador' },
  { code: '+240', flag: '🇬🇶', label: 'Equatorial Guinea' },
  { code: '+291', flag: '🇪🇷', label: 'Eritrea' },
  { code: '+372', flag: '🇪🇪', label: 'Estonia' },
  { code: '+268', flag: '🇸🇿', label: 'Eswatini' },
  { code: '+251', flag: '🇪🇹', label: 'Ethiopia' },
  { code: '+679', flag: '🇫🇯', label: 'Fiji' },
  { code: '+358', flag: '🇫🇮', label: 'Finland' },
  { code: '+33', flag: '🇫🇷', label: 'France' },
  { code: '+241', flag: '🇬🇦', label: 'Gabon' },
  { code: '+220', flag: '🇬🇲', label: 'Gambia' },
  { code: '+995', flag: '🇬🇪', label: 'Georgia' },
  { code: '+49', flag: '🇩🇪', label: 'Germany' },
  { code: '+233', flag: '🇬🇭', label: 'Ghana' },
  { code: '+30', flag: '🇬🇷', label: 'Greece' },
  { code: '+1473', flag: '🇬🇩', label: 'Grenada' },
  { code: '+502', flag: '🇬🇹', label: 'Guatemala' },
  { code: '+224', flag: '🇬🇳', label: 'Guinea' },
  { code: '+245', flag: '🇬🇼', label: 'Guinea-Bissau' },
  { code: '+592', flag: '🇬🇾', label: 'Guyana' },
  { code: '+509', flag: '🇭🇹', label: 'Haiti' },
  { code: '+504', flag: '🇭🇳', label: 'Honduras' },
  { code: '+852', flag: '🇭🇰', label: 'Hong Kong' },
  { code: '+36', flag: '🇭🇺', label: 'Hungary' },
  { code: '+354', flag: '🇮🇸', label: 'Iceland' },
  { code: '+91', flag: '🇮🇳', label: 'India' },
  { code: '+62', flag: '🇮🇩', label: 'Indonesia' },
  { code: '+98', flag: '🇮🇷', label: 'Iran' },
  { code: '+964', flag: '🇮🇶', label: 'Iraq' },
  { code: '+353', flag: '🇮🇪', label: 'Ireland' },
  { code: '+972', flag: '🇮🇱', label: 'Israel' },
  { code: '+39', flag: '🇮🇹', label: 'Italy' },
  { code: '+1876', flag: '🇯🇲', label: 'Jamaica' },
  { code: '+81', flag: '🇯🇵', label: 'Japan' },
  { code: '+962', flag: '🇯🇴', label: 'Jordan' },
  { code: '+7', flag: '🇰🇿', label: 'Kazakhstan' },
  { code: '+254', flag: '🇰🇪', label: 'Kenya' },
  { code: '+686', flag: '🇰🇮', label: 'Kiribati' },
  { code: '+383', flag: '🇽🇰', label: 'Kosovo' },
  { code: '+965', flag: '🇰🇼', label: 'Kuwait' },
  { code: '+996', flag: '🇰🇬', label: 'Kyrgyzstan' },
  { code: '+856', flag: '🇱🇦', label: 'Laos' },
  { code: '+371', flag: '🇱🇻', label: 'Latvia' },
  { code: '+961', flag: '🇱🇧', label: 'Lebanon' },
  { code: '+266', flag: '🇱🇸', label: 'Lesotho' },
  { code: '+231', flag: '🇱🇷', label: 'Liberia' },
  { code: '+218', flag: '🇱🇾', label: 'Libya' },
  { code: '+423', flag: '🇱🇮', label: 'Liechtenstein' },
  { code: '+370', flag: '🇱🇹', label: 'Lithuania' },
  { code: '+352', flag: '🇱🇺', label: 'Luxembourg' },
  { code: '+853', flag: '🇲🇴', label: 'Macau' },
  { code: '+261', flag: '🇲🇬', label: 'Madagascar' },
  { code: '+265', flag: '🇲🇼', label: 'Malawi' },
  { code: '+60', flag: '🇲🇾', label: 'Malaysia' },
  { code: '+960', flag: '🇲🇻', label: 'Maldives' },
  { code: '+223', flag: '🇲🇱', label: 'Mali' },
  { code: '+356', flag: '🇲🇹', label: 'Malta' },
  { code: '+692', flag: '🇲🇭', label: 'Marshall Islands' },
  { code: '+222', flag: '🇲🇷', label: 'Mauritania' },
  { code: '+230', flag: '🇲🇺', label: 'Mauritius' },
  { code: '+52', flag: '🇲🇽', label: 'Mexico' },
  { code: '+691', flag: '🇫🇲', label: 'Micronesia' },
  { code: '+373', flag: '🇲🇩', label: 'Moldova' },
  { code: '+377', flag: '🇲🇨', label: 'Monaco' },
  { code: '+976', flag: '🇲🇳', label: 'Mongolia' },
  { code: '+382', flag: '🇲🇪', label: 'Montenegro' },
  { code: '+212', flag: '🇲🇦', label: 'Morocco' },
  { code: '+258', flag: '🇲🇿', label: 'Mozambique' },
  { code: '+95', flag: '🇲🇲', label: 'Myanmar' },
  { code: '+264', flag: '🇳🇦', label: 'Namibia' },
  { code: '+674', flag: '🇳🇷', label: 'Nauru' },
  { code: '+977', flag: '🇳🇵', label: 'Nepal' },
  { code: '+31', flag: '🇳🇱', label: 'Netherlands' },
  { code: '+64', flag: '🇳🇿', label: 'New Zealand' },
  { code: '+505', flag: '🇳🇮', label: 'Nicaragua' },
  { code: '+227', flag: '🇳🇪', label: 'Niger' },
  { code: '+234', flag: '🇳🇬', label: 'Nigeria' },
  { code: '+850', flag: '🇰🇵', label: 'North Korea' },
  { code: '+389', flag: '🇲🇰', label: 'North Macedonia' },
  { code: '+47', flag: '🇳🇴', label: 'Norway' },
  { code: '+968', flag: '🇴🇲', label: 'Oman' },
  { code: '+92', flag: '🇵🇰', label: 'Pakistan' },
  { code: '+680', flag: '🇵🇼', label: 'Palau' },
  { code: '+970', flag: '🇵🇸', label: 'Palestine' },
  { code: '+507', flag: '🇵🇦', label: 'Panama' },
  { code: '+675', flag: '🇵🇬', label: 'Papua New Guinea' },
  { code: '+595', flag: '🇵🇾', label: 'Paraguay' },
  { code: '+51', flag: '🇵🇪', label: 'Peru' },
  { code: '+63', flag: '🇵🇭', label: 'Philippines' },
  { code: '+48', flag: '🇵🇱', label: 'Poland' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal' },
  { code: '+974', flag: '🇶🇦', label: 'Qatar' },
  { code: '+40', flag: '🇷🇴', label: 'Romania' },
  { code: '+7', flag: '🇷🇺', label: 'Russia' },
  { code: '+250', flag: '🇷🇼', label: 'Rwanda' },
  { code: '+1869', flag: '🇰🇳', label: 'Saint Kitts & Nevis' },
  { code: '+1758', flag: '🇱🇨', label: 'Saint Lucia' },
  { code: '+1784', flag: '🇻🇨', label: 'Saint Vincent & Grenadines' },
  { code: '+685', flag: '🇼🇸', label: 'Samoa' },
  { code: '+378', flag: '🇸🇲', label: 'San Marino' },
  { code: '+239', flag: '🇸🇹', label: 'São Tomé & Príncipe' },
  { code: '+966', flag: '🇸🇦', label: 'Saudi Arabia' },
  { code: '+221', flag: '🇸🇳', label: 'Senegal' },
  { code: '+381', flag: '🇷🇸', label: 'Serbia' },
  { code: '+248', flag: '🇸🇨', label: 'Seychelles' },
  { code: '+232', flag: '🇸🇱', label: 'Sierra Leone' },
  { code: '+65', flag: '🇸🇬', label: 'Singapore' },
  { code: '+421', flag: '🇸🇰', label: 'Slovakia' },
  { code: '+386', flag: '🇸🇮', label: 'Slovenia' },
  { code: '+677', flag: '🇸🇧', label: 'Solomon Islands' },
  { code: '+252', flag: '🇸🇴', label: 'Somalia' },
  { code: '+27', flag: '🇿🇦', label: 'South Africa' },
  { code: '+82', flag: '🇰🇷', label: 'South Korea' },
  { code: '+211', flag: '🇸🇸', label: 'South Sudan' },
  { code: '+34', flag: '🇪🇸', label: 'Spain' },
  { code: '+94', flag: '🇱🇰', label: 'Sri Lanka' },
  { code: '+249', flag: '🇸🇩', label: 'Sudan' },
  { code: '+597', flag: '🇸🇷', label: 'Suriname' },
  { code: '+46', flag: '🇸🇪', label: 'Sweden' },
  { code: '+41', flag: '🇨🇭', label: 'Switzerland' },
  { code: '+963', flag: '🇸🇾', label: 'Syria' },
  { code: '+886', flag: '🇹🇼', label: 'Taiwan' },
  { code: '+992', flag: '🇹🇯', label: 'Tajikistan' },
  { code: '+255', flag: '🇹🇿', label: 'Tanzania' },
  { code: '+66', flag: '🇹🇭', label: 'Thailand' },
  { code: '+670', flag: '🇹🇱', label: 'Timor-Leste' },
  { code: '+228', flag: '🇹🇬', label: 'Togo' },
  { code: '+676', flag: '🇹🇴', label: 'Tonga' },
  { code: '+1868', flag: '🇹🇹', label: 'Trinidad & Tobago' },
  { code: '+216', flag: '🇹🇳', label: 'Tunisia' },
  { code: '+90', flag: '🇹🇷', label: 'Turkey' },
  { code: '+993', flag: '🇹🇲', label: 'Turkmenistan' },
  { code: '+688', flag: '🇹🇻', label: 'Tuvalu' },
  { code: '+256', flag: '🇺🇬', label: 'Uganda' },
  { code: '+380', flag: '🇺🇦', label: 'Ukraine' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+598', flag: '🇺🇾', label: 'Uruguay' },
  { code: '+998', flag: '🇺🇿', label: 'Uzbekistan' },
  { code: '+678', flag: '🇻🇺', label: 'Vanuatu' },
  { code: '+58', flag: '🇻🇪', label: 'Venezuela' },
  { code: '+84', flag: '🇻🇳', label: 'Vietnam' },
  { code: '+967', flag: '🇾🇪', label: 'Yemen' },
  { code: '+260', flag: '🇿🇲', label: 'Zambia' },
  { code: '+263', flag: '🇿🇼', label: 'Zimbabwe' },
];

function parsePhone(value: string): { code: string; number: string } {
  if (!value) return { code: '+965', number: '' };
  // Try longest prefix first to avoid '+1' matching '+965' etc.
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (value.startsWith(c.code)) {
      return { code: c.code, number: value.slice(c.code.length) };
    }
  }
  return { code: '+965', number: value.replace(/^\+/, '') };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

export function PhoneInput({ value, onChange, label, error }: PhoneInputProps) {
  const parsed = parsePhone(value);
  const [code, setCode] = useState(parsed.code);
  const [num, setNum] = useState(parsed.number);

  function handleCode(newCode: string) {
    setCode(newCode);
    onChange(newCode + num);
  }

  function handleNum(raw: string) {
    const digits = raw.replace(/\D/g, '');
    setNum(digits);
    onChange(code + digits);
  }

  return (
    <div>
      <label className="label-text">{label}</label>
      <div className="flex gap-2 mt-1">
        <select
          value={code}
          onChange={(e) => handleCode(e.target.value)}
          className="input-field w-28 flex-shrink-0"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.code}-${c.label}`} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={num}
          onChange={(e) => handleNum(e.target.value)}
          inputMode="numeric"
          placeholder="99887766"
          className={`input-field flex-1 ${error ? 'input-field-error' : ''}`}
        />
      </div>
      {error && <p className="text-[13px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
