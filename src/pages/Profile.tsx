import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import Header from '../components/Header';

interface ProfileData {
    id: string;
    email: string;
    name?: string;
    surname?: string;
    phone?: string;
    role: string;
    createdAt?: string;
    lastLoginAt?: string;
}

interface ProfileFieldErrors {
    name?: string;
    surname?: string;
    phone?: string;
}

interface PasswordFieldErrors {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const Profile = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, refreshUser, logout } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Profile update form
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [profileErrors, setProfileErrors] = useState<ProfileFieldErrors>({});
    const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});

    // Password update form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<PasswordFieldErrors>({});
    const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadProfile();
    }, [isAuthenticated, navigate]);

        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await apiClient.getProfile() as ProfileData;
                setProfile(data);
                setName(data.name || '');
                setSurname(data.surname || '');
                setPhone(data.phone || '');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

    // Validation functions (same as Register page)
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
        
        // Phone is required
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

    const validateProfileField = (fieldName: string, value: string): void => {
        let error: string | undefined;
        
        switch (fieldName) {
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

        setProfileErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    const validatePasswordField = (fieldName: string, value: string): void => {
        let error: string | undefined;
        
        switch (fieldName) {
            case 'currentPassword':
                error = value ? undefined : t('auth.validation.password_required', 'Password is required');
                break;
            case 'newPassword':
                error = validatePassword(value);
                // Also re-validate confirmPassword if it's been touched
                if (passwordTouched.confirmPassword) {
                    const confirmError = validateConfirmPassword(confirmPassword, value);
                    setPasswordErrors(prev => ({ ...prev, confirmPassword: confirmError }));
                }
                break;
            case 'confirmPassword':
                error = validateConfirmPassword(value, newPassword);
                break;
        }

        setPasswordErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    const handleProfileBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileTouched(prev => ({ ...prev, [name]: true }));
        validateProfileField(name, value);
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'name') {
            setName(value);
        } else if (name === 'surname') {
            setSurname(value);
        } else if (name === 'phone') {
            setPhone(value);
        }
        
        if (profileErrors[name as keyof ProfileFieldErrors]) {
            setProfileErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordTouched(prev => ({ ...prev, [name]: true }));
        validatePasswordField(name, value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'currentPassword') {
            setCurrentPassword(value);
        } else if (name === 'newPassword') {
            setNewPassword(value);
            // Real-time validation for password confirmation
            if (passwordTouched.confirmPassword) {
                validatePasswordField('confirmPassword', confirmPassword);
            }
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }
        
        if (passwordErrors[name as keyof PasswordFieldErrors]) {
            setPasswordErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateAllProfile = (): boolean => {
        const newErrors: ProfileFieldErrors = {};
        
        newErrors.name = validateName(name);
        newErrors.surname = validateSurname(surname);
        newErrors.phone = validatePhone(phone);

        setProfileErrors(newErrors);
        setProfileTouched({
            name: true,
            surname: true,
            phone: true,
        });

        return !Object.values(newErrors).some(error => error !== undefined);
    };

    const validateAllPassword = (): boolean => {
        const newErrors: PasswordFieldErrors = {};
        
        if (!currentPassword) {
            newErrors.currentPassword = t('auth.validation.password_required', 'Password is required');
        }
        newErrors.newPassword = validatePassword(newPassword);
        newErrors.confirmPassword = validateConfirmPassword(confirmPassword, newPassword);

        setPasswordErrors(newErrors);
        setPasswordTouched({
            currentPassword: true,
            newPassword: true,
            confirmPassword: true,
        });

        return !Object.values(newErrors).some(error => error !== undefined);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateAllProfile()) {
            setError(t('auth.validation.fix_errors', 'Please fix the errors below'));
            return;
        }

        setUpdatingProfile(true);

        try {
            await apiClient.updateProfile({ 
                name: name.trim(), 
                surname: surname.trim(), 
                phone: phone.trim() 
            });
            setSuccess('Profile updated successfully');
            await refreshUser();
            await loadProfile();
            setProfileErrors({});
            setProfileTouched({});
        } catch (err: any) {
            const errorData = err.response?.data || err.data || {};
            
            if (errorData.errors && Array.isArray(errorData.errors)) {
                const backendErrors = errorData.errors;
                const fieldErrors: ProfileFieldErrors = {};
                backendErrors.forEach((error: { field: string; message: string }) => {
                    const fieldMap: Record<string, keyof ProfileFieldErrors> = {
                        'name': 'name',
                        'surname': 'surname',
                        'phone': 'phone',
                    };
                    const frontendField = fieldMap[error.field];
                    if (frontendField) {
                        fieldErrors[frontendField] = error.message;
                    }
                });
                setProfileErrors(fieldErrors);
                setError(errorData.error || t('auth.validation.fix_errors', 'Please fix the errors below'));
            } else {
                setError(errorData.error || err.message || 'Failed to update profile');
            }
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateAllPassword()) {
            setError(t('auth.validation.fix_errors', 'Please fix the errors below'));
            return;
        }

        setUpdatingPassword(true);

        try {
            await apiClient.updatePassword(currentPassword, newPassword);
            setSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordErrors({});
            setPasswordTouched({});
        } catch (err: any) {
            const errorData = err.response?.data || err.data || {};
            
            if (errorData.errors && Array.isArray(errorData.errors)) {
                const backendErrors = errorData.errors;
                const fieldErrors: PasswordFieldErrors = {};
                backendErrors.forEach((error: { field: string; message: string }) => {
                    const fieldMap: Record<string, keyof PasswordFieldErrors> = {
                        'currentPassword': 'currentPassword',
                        'newPassword': 'newPassword',
                    };
                    const frontendField = fieldMap[error.field];
                    if (frontendField) {
                        fieldErrors[frontendField] = error.message;
                    }
                });
                setPasswordErrors(fieldErrors);
                setError(errorData.error || t('auth.validation.fix_errors', 'Please fix the errors below'));
            } else {
                setError(errorData.error || err.message || 'Failed to update password');
            }
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center">
                    <div className="text-[#2d4033]">Loading...</div>
                </div>
            </>
        );
    }

    if (!profile) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center">
                    <div className="text-red-600">Failed to load profile</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen pt-20 bg-[#faf9f6]">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-8">
                        {t('profile.title', 'Profile')}
                    </h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                            {success}
                        </div>
                    )}

                    {/* Profile Information Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-8 mb-8">
                        <h2 className="text-2xl font-serif font-semibold text-[#2d4033] mb-6">
                            {t('profile.personalInfo', 'Personal Information')}
                        </h2>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#2d4033] mb-2">
                                        {t('profile.email', 'Email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full px-4 py-2 border border-[#2d4033]/20 rounded bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#2d4033] mb-2">
                                        {t('profile.name', 'Name')}
                                    </label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={handleProfileChange}
                                        onBlur={handleProfileBlur}
                                        className={`w-full px-4 py-2 border rounded focus:outline-none transition-colors ${
                                            profileErrors.name ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent'
                                        }`}
                                        placeholder={t('profile.namePlaceholder', 'Enter your name')}
                                    />
                                    {profileErrors.name && profileTouched.name && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#2d4033] mb-2">
                                        {t('profile.surname', 'Surname')}
                                    </label>
                                    <input
                                        name="surname"
                                        type="text"
                                        required
                                        value={surname}
                                        onChange={handleProfileChange}
                                        onBlur={handleProfileBlur}
                                        className={`w-full px-4 py-2 border rounded focus:outline-none transition-colors ${
                                            profileErrors.surname ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent'
                                        }`}
                                        placeholder={t('profile.surnamePlaceholder', 'Enter your surname')}
                                    />
                                    {profileErrors.surname && profileTouched.surname && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.surname}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#2d4033] mb-2">
                                        {t('profile.phone', 'Phone')}
                                    </label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={handleProfileChange}
                                        onBlur={handleProfileBlur}
                                        className={`w-full px-4 py-2 border rounded focus:outline-none transition-colors ${
                                            profileErrors.phone ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent'
                                        }`}
                                        placeholder={t('profile.phonePlaceholder', 'Enter your phone number')}
                                    />
                                    {profileErrors.phone && profileTouched.phone && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.phone}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updatingProfile}
                                    className="px-6 py-2 bg-[#c5a059] text-white font-medium rounded hover:bg-[#b08d4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updatingProfile ? t('profile.updating', 'Updating...') : t('profile.updateProfile', 'Update Profile')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Update Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-8">
                        <h2 className="text-2xl font-serif font-semibold text-[#2d4033] mb-6">
                            {t('profile.changePassword', 'Change Password')}
                        </h2>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[#2d4033] mb-2">
                                    {t('profile.currentPassword', 'Current Password')}
                                </label>
                                <input
                                    name="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={handlePasswordChange}
                                    onBlur={handlePasswordBlur}
                                    required
                                    className={`w-full px-4 py-2 border rounded focus:outline-none transition-colors ${
                                        passwordErrors.currentPassword ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent'
                                    }`}
                                    placeholder={t('profile.currentPasswordPlaceholder', 'Enter current password')}
                                />
                                {passwordErrors.currentPassword && passwordTouched.currentPassword && (
                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#2d4033] mb-2">
                                    {t('profile.newPassword', 'New Password')}
                                </label>
                                <input
                                    name="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    onBlur={handlePasswordBlur}
                                    required
                                    className={`w-full px-4 py-2 border rounded focus:outline-none transition-colors ${
                                        passwordErrors.newPassword ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent'
                                    }`}
                                    placeholder={t('profile.newPasswordPlaceholder', 'Enter new password (min 6 characters)')}
                                />
                                {passwordErrors.newPassword && passwordTouched.newPassword && (
                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#2d4033] mb-2">
                                    {t('profile.confirmPassword', 'Confirm New Password')}
                                </label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={handlePasswordChange}
                                    onBlur={handlePasswordBlur}
                                    required
                                    className={`w-full px-4 py-2 border rounded focus:outline-none transition-colors ${
                                        passwordErrors.confirmPassword ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent'
                                    }`}
                                    placeholder={t('profile.confirmPasswordPlaceholder', 'Confirm new password')}
                                />
                                {passwordErrors.confirmPassword && passwordTouched.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updatingPassword}
                                    className="px-6 py-2 bg-[#c5a059] text-white font-medium rounded hover:bg-[#b08d4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updatingPassword ? t('profile.updating', 'Updating...') : t('profile.updatePassword', 'Update Password')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Orders Link Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-8 mt-8">
                        <h2 className="text-2xl font-serif font-semibold text-[#2d4033] mb-4">
                            {t('profile.myOrders', 'My Orders')}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {t('profile.viewOrders', 'View and manage your order history')}
                        </p>
                        <Link
                            to="/orders"
                            className="inline-block bg-[#c5a059] text-white px-6 py-3 rounded-md hover:bg-[#b08d4a] transition-colors font-medium mr-4"
                        >
                            {t('profile.viewAllOrders', 'View All Orders')}
                        </Link>
                    </div>

                    {/* Logout Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-8 mt-8">
                        <h2 className="text-2xl font-serif font-semibold text-[#2d4033] mb-4">
                            {t('profile.account', 'Account')}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {t('profile.logoutDescription', 'Sign out of your account')}
                        </p>
                        <button
                            onClick={() => {
                                logout();
                            }}
                            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                        >
                            {t('auth.logout', 'Logout')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;

