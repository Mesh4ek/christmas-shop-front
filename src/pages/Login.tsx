import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData);
            // Redirect to the page user came from, or home
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from);
        } catch (err: any) {
            setError(err.message || t('auth.login_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6 py-20">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif mb-4 text-[#2d4033]">
                        {t('auth.welcome_back')}
                    </h1>
                    <p className="text-gray-500">{t('auth.login_subtitle')}</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8 border border-[#2d4033]/10">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-[#2d4033] mb-2 uppercase tracking-wider"
                            >
                                {t('auth.email')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full px-4 py-3 border border-[#2d4033]/20 focus:border-[#c5a059] outline-none transition-colors bg-[#faf9f6]"
                                placeholder={t('auth.email_placeholder')}
                            />
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
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="w-full px-4 py-3 border border-[#2d4033]/20 focus:border-[#c5a059] outline-none transition-colors bg-[#faf9f6]"
                                placeholder={t('auth.password_placeholder')}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-10 py-4 bg-[#c5a059] text-white uppercase tracking-widest text-sm font-semibold hover:bg-[#b08d4a] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#c5a059]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('auth.loading') : t('auth.login')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            {t('auth.no_account')}{' '}
                            <Link
                                to="/register"
                                className="text-[#c5a059] hover:text-[#b08d4a] font-medium transition-colors"
                            >
                                {t('auth.register_here')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

