import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface FieldErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
    surname?: string;
    phone?: string;
}

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: '',
        phone: '',
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Validation functions
    const validateEmail = (email: string): string | undefined => {
        const trimmedEmail = email.trim();
        
        if (!trimmedEmail) {
            return t('auth.validation.email_required', 'Email is required');
        }

        // More comprehensive email validation regex
        // Matches RFC 5322 standard more closely
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(trimmedEmail)) {
            return t('auth.validation.email_invalid', 'Invalid email format');
        }

        // Additional checks for common invalid patterns
        if (trimmedEmail.length > 254) {
            return t('auth.validation.email_too_long', 'Email is too long (max 254 characters)');
        }

        // Check for consecutive dots
        if (trimmedEmail.includes('..')) {
            return t('auth.validation.email_invalid', 'Invalid email format');
        }

        // Check that domain has at least one dot
        const parts = trimmedEmail.split('@');
        if (parts.length !== 2 || !parts[1].includes('.')) {
            return t('auth.validation.email_invalid', 'Invalid email format');
        }

        // Check that domain part is valid
        const domain = parts[1];
        if (domain.length < 4) {
            return t('auth.validation.email_invalid', 'Invalid email format');
        }
        
        const domainParts = domain.split('.');
        
        // Check that no domain part is empty
        if (domainParts.some(part => part.length === 0)) {
            return t('auth.validation.email_invalid', 'Invalid email format');
        }
        
        // Check that TLD (top-level domain, last part) is at least 2 characters
        const tld = domainParts[domainParts.length - 1];
        if (tld.length < 2) {
            return t('auth.validation.email_invalid', 'Invalid email format');
        }

        return undefined;
    };

    const validatePassword = (password: string): string | undefined => {
        if (!password) {
            return t('auth.validation.password_required', 'Password is required');
        }
        if (password.length < 6) {
            return t('auth.password_too_short');
        }
        if (password.length > 100) {
            return t('auth.validation.password_too_long', 'Password must be less than 100 characters');
        }
        if (!/[A-Za-z]/.test(password)) {
            return t('auth.validation.password_letter', 'Password must contain at least one letter');
        }
        if (!/[0-9]/.test(password)) {
            return t('auth.validation.password_number', 'Password must contain at least one number');
        }
        return undefined;
    };

    const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
        if (!confirmPassword) {
            return t('auth.validation.confirm_password_required', 'Please confirm your password');
        }
        if (confirmPassword !== password) {
            return t('auth.password_mismatch');
        }
        return undefined;
    };

    const validateName = (name: string): string | undefined => {
        const trimmedName = name.trim();
        
        if (!trimmedName) {
            return t('auth.validation.name_required', 'Name is required');
        }
        
        if (trimmedName.length < 2) {
            return t('auth.validation.name_too_short', 'Name must be at least 2 characters long');
        }
        
        if (trimmedName.length > 30) {
            return t('auth.validation.name_too_long', 'Name must be less than 30 characters');
        }
        
        // Allow letters (including Ukrainian), spaces, hyphens, and apostrophes
        if (!/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]+$/.test(trimmedName)) {
            return t('auth.validation.name_invalid', 'Name can only contain letters, spaces, hyphens, and apostrophes');
        }
        
        return undefined;
    };

    const validateSurname = (surname: string): string | undefined => {
        const trimmedSurname = surname.trim();
        
        if (!trimmedSurname) {
            return t('auth.validation.surname_required', 'Surname is required');
        }
        
        if (trimmedSurname.length < 2) {
            return t('auth.validation.surname_too_short', 'Surname must be at least 2 characters long');
        }
        
        if (trimmedSurname.length > 30) {
            return t('auth.validation.surname_too_long', 'Surname must be less than 30 characters');
        }
        
        // Allow letters (including Ukrainian), spaces, hyphens, and apostrophes
        if (!/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]+$/.test(trimmedSurname)) {
            return t('auth.validation.surname_invalid', 'Surname can only contain letters, spaces, hyphens, and apostrophes');
        }
        
        return undefined;
    };

    const validatePhone = (phone: string): string | undefined => {
        const trimmedPhone = phone.trim();
        
        // Phone is now required
        if (!trimmedPhone) {
            return t('auth.validation.phone_required', 'Phone is required');
        }

        // Check maximum length
        if (trimmedPhone.length > 20) {
            return t('auth.validation.phone_too_long', 'Phone must be less than 20 characters');
        }

        // Check minimum length (at least 7 digits for a valid phone number)
        const digitsOnly = trimmedPhone.replace(/\D/g, '');
        if (digitsOnly.length < 7) {
            return t('auth.validation.phone_too_short', 'Phone number must contain at least 7 digits');
        }

        // Check for valid phone characters (digits, spaces, hyphens, plus, parentheses)
        if (!/^[\d\s\-\+\(\)]+$/.test(trimmedPhone)) {
            return t('auth.validation.phone_invalid_chars', 'Phone contains invalid characters. Only digits, spaces, hyphens, plus sign, and parentheses are allowed');
        }

        // Check that phone starts with a digit or + (for international format)
        if (!/^[\d\+]/.test(trimmedPhone)) {
            return t('auth.validation.phone_invalid_format', 'Phone number must start with a digit or + sign');
        }

        // Check that it doesn't end with a special character
        if (/[\s\-\+\(\)]$/.test(trimmedPhone)) {
            return t('auth.validation.phone_invalid_format', 'Phone number cannot end with a special character');
        }

        // Check for balanced parentheses
        const openParens = (trimmedPhone.match(/\(/g) || []).length;
        const closeParens = (trimmedPhone.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            return t('auth.validation.phone_invalid_format', 'Phone number has unbalanced parentheses');
        }

        // Check that plus sign is only at the beginning (for international format)
        if (trimmedPhone.includes('+') && !trimmedPhone.startsWith('+')) {
            return t('auth.validation.phone_invalid_format', 'Plus sign (+) can only be at the beginning for international format');
        }

        return undefined;
    };

    const validateField = (name: string, value: string): void => {
        let error: string | undefined;
        
        switch (name) {
            case 'email':
                error = validateEmail(value);
                break;
            case 'password':
                error = validatePassword(value);
                // Also re-validate confirmPassword if it's been touched
                if (touched.confirmPassword) {
                    const confirmError = validateConfirmPassword(formData.confirmPassword, value);
                    setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
                }
                break;
            case 'confirmPassword':
                error = validateConfirmPassword(value, formData.password);
                break;
            case 'name':
                error = validateName(value);
                break;
            case 'surname':
                error = validateSurname(value);
                break;
            case 'phone':
                error = validatePhone(value);
                break;
        }

        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        validateField(name, value);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name as keyof FieldErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        
        // Real-time validation for password confirmation
        if (name === 'password' && touched.confirmPassword) {
            validateField('confirmPassword', formData.confirmPassword);
        }
    };

    const validateAll = (): boolean => {
        const newErrors: FieldErrors = {};
        
        newErrors.email = validateEmail(formData.email);
        newErrors.password = validatePassword(formData.password);
        newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password);
        newErrors.name = validateName(formData.name);
        newErrors.surname = validateSurname(formData.surname);
        newErrors.phone = validatePhone(formData.phone);

        setErrors(newErrors);
        setTouched({
            email: true,
            password: true,
            confirmPassword: true,
            name: true,
            surname: true,
            phone: true,
        });

        return !Object.values(newErrors).some(error => error !== undefined);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateAll()) {
            setError(t('auth.validation.fix_errors', 'Please fix the errors below'));
            return;
        }

        setLoading(true);

        try {
            await register({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                name: formData.name.trim(),
                surname: formData.surname.trim(),
                phone: formData.phone.trim(),
            });
            navigate('/');
        } catch (err: any) {
            const errorData = err.response?.data || err.data || {};
            
            if (errorData.errors && Array.isArray(errorData.errors)) {
                const backendErrors = errorData.errors;
                const fieldErrors: FieldErrors = {};
                backendErrors.forEach((error: { field: string; message: string }) => {
                    // Map backend field names to frontend field names
                    const fieldMap: Record<string, keyof FieldErrors> = {
                        'email': 'email',
                        'password': 'password',
                        'name': 'name',
                        'surname': 'surname',
                        'phone': 'phone',
                    };
                    const frontendField = fieldMap[error.field];
                    if (frontendField) {
                        fieldErrors[frontendField] = error.message;
                    }
                });
                setErrors(fieldErrors);
                setError(errorData.error || t('auth.validation.fix_errors', 'Please fix the errors below'));
            } else {
                setError(errorData.error || err.message || t('auth.register_error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6 py-20">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif mb-4 text-[#2d4033]">
                        {t('auth.join_us')}
                    </h1>
                    <p className="text-gray-500">{t('auth.register_subtitle')}</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8 border border-[#2d4033]/10">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-[#2d4033] mb-2 uppercase tracking-wider"
                                >
                                    {t('auth.name')}
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`w-full px-4 py-3 border outline-none transition-colors bg-[#faf9f6] ${
                                        errors.name ? 'border-red-500 focus:border-red-500' : 'border-[#2d4033]/20 focus:border-[#c5a059]'
                                    }`}
                                    placeholder={t('auth.name_placeholder')}
                                />
                                {errors.name && touched.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="surname"
                                    className="block text-sm font-medium text-[#2d4033] mb-2 uppercase tracking-wider"
                                >
                                    {t('auth.surname')}
                                </label>
                                <input
                                    id="surname"
                                    name="surname"
                                    type="text"
                                    required
                                    value={formData.surname}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`w-full px-4 py-3 border outline-none transition-colors bg-[#faf9f6] ${
                                        errors.surname ? 'border-red-500 focus:border-red-500' : 'border-[#2d4033]/20 focus:border-[#c5a059]'
                                    }`}
                                    placeholder={t('auth.surname_placeholder')}
                                />
                                {errors.surname && touched.surname && (
                                    <p className="mt-1 text-sm text-red-600">{errors.surname}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-[#2d4033] mb-2 uppercase tracking-wider"
                            >
                                {t('auth.email')}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-3 border outline-none transition-colors bg-[#faf9f6] ${
                                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-[#2d4033]/20 focus:border-[#c5a059]'
                                }`}
                                placeholder={t('auth.email_placeholder')}
                            />
                            {errors.email && touched.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-[#2d4033] mb-2 uppercase tracking-wider"
                            >
                                {t('auth.phone')}
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-3 border outline-none transition-colors bg-[#faf9f6] ${
                                    errors.phone ? 'border-red-500 focus:border-red-500' : 'border-[#2d4033]/20 focus:border-[#c5a059]'
                                }`}
                                placeholder={t('auth.phone_placeholder')}
                            />
                            {errors.phone && touched.phone && (
                                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[#2d4033] mb-2 uppercase tracking-wider"
                            >
                                {t('auth.password')}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-3 border outline-none transition-colors bg-[#faf9f6] ${
                                    errors.password ? 'border-red-500 focus:border-red-500' : 'border-[#2d4033]/20 focus:border-[#c5a059]'
                                }`}
                                placeholder={t('auth.password_placeholder')}
                            />
                            {errors.password && touched.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-[#2d4033] mb-2 uppercase tracking-wider"
                            >
                                {t('auth.confirm_password')}
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-3 border outline-none transition-colors bg-[#faf9f6] ${
                                    errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-[#2d4033]/20 focus:border-[#c5a059]'
                                }`}
                                placeholder={t('auth.confirm_password_placeholder')}
                            />
                            {errors.confirmPassword && touched.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-10 py-4 bg-[#c5a059] text-white uppercase tracking-widest text-sm font-semibold hover:bg-[#b08d4a] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#c5a059]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('auth.loading') : t('auth.register')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            {t('auth.have_account')}{' '}
                            <Link
                                to="/login"
                                className="text-[#c5a059] hover:text-[#b08d4a] font-medium transition-colors"
                            >
                                {t('auth.login_here')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

