import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-[#1a261e] text-white py-12 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="text-2xl font-serif font-bold tracking-tight text-[#c5a059] mb-4">
                        ANDRII <span className="text-white font-light">BOUTIQUE</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                        {t('footer.description')}
                    </p>
                </div>
            </div>
            <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 tracking-widest uppercase">
                <p>Andrii Boutique Luxury Group © 2026 PJATK</p>
                <div className="space-x-8 mt-4 md:mt-0">
                    <a href="#">{t('footer.privacy')}</a>
                    <a href="#">{t('footer.terms')}</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
