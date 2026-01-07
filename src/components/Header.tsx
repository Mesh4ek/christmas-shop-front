import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const INSTAGRAM_URL = 'https://www.instagram.com/ya_mesh4ek/';

const Header = () => {
    const { t, i18n } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const { getTotalItems } = useCart();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'uk' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-[#faf9f6]/80 backdrop-blur-md border-b border-[#2d4033]/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-serif font-bold tracking-tight text-[#c5a059] hover:opacity-80 transition-opacity">
                        ANDRII <span className="text-[#2d4033] font-light">BOUTIQUE</span>
                    </Link>
                <div className="hidden md:flex space-x-12 text-sm uppercase tracking-widest font-medium">
                    <Link to="/products" className="hover:text-[#c5a059] transition-colors">{t('nav.products')}</Link>
                    <a 
                        href={INSTAGRAM_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-[#c5a059] transition-colors flex items-center gap-2"
                        aria-label="Instagram"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                        <span>{t('nav.instagram', 'Instagram')}</span>
                    </a>
                </div>
                <div className="flex items-center space-x-6">
                    {isAuthenticated ? (
                        <>
                            {user?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="text-xs font-bold uppercase tracking-widest hover:text-[#c5a059] transition-colors border border-[#c5a059]/30 px-3 py-1 rounded cursor-pointer text-[#c5a059]"
                                >
                                    {t('nav.admin', 'Admin')}
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className="text-xs font-bold uppercase tracking-widest hover:text-[#c5a059] transition-colors border border-[#2d4033]/20 px-3 py-1 rounded cursor-pointer"
                            >
                                {t('nav.profile', 'Profile')}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-xs font-bold uppercase tracking-widest hover:text-[#c5a059] transition-colors border border-[#2d4033]/20 px-3 py-1 rounded"
                            >
                                {t('auth.login')}
                            </Link>
                            <Link
                                to="/register"
                                className="text-xs font-bold uppercase tracking-widest bg-[#c5a059] text-white hover:bg-[#b08d4a] transition-colors px-3 py-1 rounded"
                            >
                                {t('auth.register')}
                            </Link>
                        </>
                    )}
                    <button
                        onClick={toggleLanguage}
                        className="p-2 hover:bg-[#2d4033]/5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                        title={i18n.language === 'en' ? 'Switch to Ukrainian' : 'Switch to English'}
                    >
                        <span className="text-xl">
                            {i18n.language === 'en' ? '🇺🇸' : '🇺🇦'}
                        </span>
                    </button>
                    <Link to="/cart" className="p-2 hover:bg-[#2d4033]/5 rounded-full transition-colors relative cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                        {getTotalItems() > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-[#c5a059] text-white text-[10px] flex items-center justify-center rounded-full">
                                {getTotalItems()}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Header;