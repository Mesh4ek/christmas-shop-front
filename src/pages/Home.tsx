import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient, type Product, getProductImageUrl } from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SnowEffect from '../components/SnowEffect';

const AnimatedCounter = ({ value, duration = 3000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        const element = document.getElementById(`counter-${value}`);
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [value, isVisible]);

    useEffect(() => {
        if (!isVisible) return;

        const startTime = Date.now();
        const startValue = 0;
        const endValue = value;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
            
            setCount(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(endValue);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, value, duration]);

    return <span id={`counter-${value}`}>{count.toLocaleString()}</span>;
};

const Home = () => {
    const { t, i18n } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState<{
        totalOrders: number;
        totalProducts: number;
        totalUsers: number;
        totalRevenue: number;
    } | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    
    const [snowEnabled, setSnowEnabled] = useState(() => {
        const saved = localStorage.getItem('snowEffect');
        return saved !== null ? saved === 'true' : true;
    });

    useEffect(() => {
        loadProducts();
        loadStatistics();
    }, [i18n.language]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const lang = i18n.language === 'uk' ? 'uk' : 'en';
            const result = await apiClient.getProducts(lang, 1, 3, true);
            
            if (result && result.data && Array.isArray(result.data)) {
                setProducts(result.data.slice(0, 3));
            } else if (Array.isArray(result)) {
                const availableProducts = result.filter(product => product.stock > 0);
                setProducts(availableProducts.slice(0, 3));
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSnow = () => {
        const newValue = !snowEnabled;
        setSnowEnabled(newValue);
        localStorage.setItem('snowEffect', String(newValue));
    };

    const loadStatistics = async () => {
        try {
            setStatsLoading(true);
            const stats = await apiClient.getStatistics();
            setStatistics(stats);
        } catch (err) {
            console.error('Failed to load statistics:', err);
            // Set default values on error
            setStatistics({
                totalOrders: 0,
                totalProducts: 0,
                totalUsers: 0,
                totalRevenue: 0,
            });
        } finally {
            setStatsLoading(false);
        }
    };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] text-[#2d4033] font-sans selection:bg-[#c5a059] selection:text-white">
            <SnowEffect enabled={snowEnabled} />
            <Header />
            
            <button
                onClick={toggleSnow}
                className="fixed top-24 right-6 z-50 bg-white/90 hover:bg-white border border-[#2d4033]/20 rounded-full p-3 shadow-lg transition-all hover:scale-110 active:scale-95"
                title={snowEnabled ? t('home.disableSnow', 'Disable Snow') : t('home.enableSnow', 'Enable Snow')}
                aria-label={snowEnabled ? t('home.disableSnow', 'Disable Snow') : t('home.enableSnow', 'Enable Snow')}
            >
                {snowEnabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#2d4033]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4M6.34 6.34l2.83 2.83m5.66 5.66l2.83 2.83M6.34 17.66l-2.83-2.83m11.32-5.66l2.83-2.83M17.66 17.66l-2.83-2.83M6.34 6.34L3.51 3.51m16.98 16.98l-2.83-2.83M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#2d4033]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
            </button>

            {/* Hero Section */}
            <section className="relative h-screen flex items-center pt-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/30 z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&q=80&w=2000"
                        alt="Christmas Hero"
                        className="w-full h-full object-cover scale-105 animate-[slow-zoom_20s_ease-in-out_infinite_alternate]"
                    />
                </div>

                <div className="relative z-20 max-w-7xl mx-auto px-6 w-full">
                    <div className="max-w-2xl text-white">
                        <h2 className="text-sm uppercase tracking-[0.3em] font-medium mb-4 animate-fade-in-up">
                            {t('hero.tagline')}
                        </h2>
                        <h1 className="text-6xl md:text-8xl font-serif mb-8 leading-tight animate-fade-in-up [animation-delay:200ms]">
                            {t('hero.title_part1')} <br />
                            <span className="italic text-[#c5a059]">{t('hero.title_magic')}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg leading-relaxed animate-fade-in-up [animation-delay:400ms]">
                            {t('hero.description')}
                        </p>
                        <div className="flex space-x-4 animate-fade-in-up [animation-delay:600ms]">
                            <button 
                                onClick={() => {
                                    document.getElementById('curated-selections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="px-10 py-5 bg-[#c5a059] text-white uppercase tracking-widest text-sm font-semibold hover:bg-[#b08d4a] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#c5a059]/20"
                            >
                                {t('hero.shop_now')}
                            </button>
                            <button 
                                onClick={() => {
                                    document.getElementById('statistics-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/30 text-white uppercase tracking-widest text-sm font-semibold hover:bg-white hover:text-[#2d4033] transition-all hover:scale-105 active:scale-95"
                            >
                                {t('hero.our_numbers', 'Our Numbers')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 13 5 5 5-5" /><path d="m7 6 5 5 5-5" /></svg>
                </div>
            </section>

            {/* Categories */}
            <section id="curated-selections" className="py-32 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                    <div>
                        <h2 className="text-[#c5a059] uppercase tracking-widest text-sm font-bold mb-4">{t('categories.tagline')}</h2>
                        <h3 className="text-4xl md:text-5xl font-serif">{t('categories.title')}</h3>
                    </div>
                    <p className="max-w-md text-gray-500 mt-6 md:mt-0 leading-relaxed text-right md:text-left">
                        {t('categories.description')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {loading ? (
                        <div className="col-span-3 text-center text-[#2d4033] py-12">
                            {t('products.loading', 'Loading products...')}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="col-span-3 text-center text-[#2d4033] py-12">
                            {t('products.noProducts', 'No products available')}
                        </div>
                    ) : (
                        products.map((product) => (
                            <Link key={product.id} to={`/products/${product.id}`} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] overflow-hidden bg-[#f0eee9] mb-6">
                                    {product.imageBase64 ? (
                                        <img
                                            src={getProductImageUrl(product.imageBase64)}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-white text-[#2d4033] px-8 py-3 uppercase tracking-tighter text-xs font-bold hover:bg-[#c5a059] hover:text-white transition-colors">
                                            {t('categories.quick_view')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-serif text-xl mb-1 group-hover:text-[#c5a059] transition-colors">{product.name}</h4>
                                        {product.description && (
                                            <p className="text-gray-400 text-sm italic">{product.description}</p>
                                        )}
                                    </div>
                                    <span className="font-medium text-lg text-[#c5a059]">{formatPrice(product.priceCents)}</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>

            {/* Featured Section */}
            <section className="bg-[#2d4033] py-32 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path fill="#FFFFFF" d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,77.3,-44.7C85.4,-31.3,90.5,-15.7,90.5,0C90.5,15.7,85.4,31.3,77.3,44.7C69.2,58.1,58.1,69.2,44.7,77.3C31.3,85.4,15.7,90.5,0,90.5C-15.7,90.5,-31.3,85.4,-44.7,77.3C-58.1,69.2,-69.2,58.1,-77.3,44.7C-85.4,31.3,-90.5,15.7,-90.5,0C-90.5,-15.7,-85.4,-31.3,-77.3,-44.7C-69.2,-58.1,-58.1,-69.2,-44.7,-77.3C-31.3,-85.4,-15.7,-90.5,0,-90.5C15.7,-90.5,31.3,-85.4,44.7,-77.3Z" transform="translate(100 100)" />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div className="relative aspect-square">
                        <div className="absolute inset-0 border-2 border-[#c5a059] translate-x-6 translate-y-6" />
                        <img
                            src="/artisan-shop.png"
                            alt="Artisanal Process"
                            className="relative z-10 w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-[#c5a059] uppercase tracking-[0.2em] text-sm font-bold mb-6">{t('artisan.tagline')}</h2>
                        <h3 className="text-5xl font-serif mb-8 leading-tight">{t('artisan.title')}</h3>
                        <p className="text-gray-300 text-lg mb-10 leading-relaxed">
                            {t('artisan.description')}
                        </p>
                        <button className="group flex items-center space-x-4 text-white uppercase tracking-widest text-sm font-bold">
                            <span>{t('artisan.cta')}</span>
                            <div className="w-12 h-1 bg-[#c5a059] group-hover:w-20 transition-all duration-300" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section id="statistics-section" className="py-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="font-serif text-5xl mb-4 text-[#2d4033]">{t('statistics.title', 'Join the Boutique')}</h2>
                    <p className="text-gray-500 mb-16 max-w-lg mx-auto leading-relaxed">
                        {t('statistics.description', 'Discover our growing community and shop')}
                    </p>
                    {statsLoading ? (
                        <div className="text-gray-500">{t('statistics.loading', 'Loading statistics...')}</div>
                    ) : statistics ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="flex flex-col items-center">
                                <div className="text-5xl font-serif font-bold text-[#c5a059] mb-2">
                                    <AnimatedCounter value={statistics.totalOrders} />
                                </div>
                                <div className="text-gray-500 uppercase tracking-widest text-sm">
                                    {t('statistics.orders', 'Orders')}
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-5xl font-serif font-bold text-[#c5a059] mb-2">
                                    <AnimatedCounter value={statistics.totalProducts} />
                                </div>
                                <div className="text-gray-500 uppercase tracking-widest text-sm">
                                    {t('statistics.products', 'Products')}
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-5xl font-serif font-bold text-[#c5a059] mb-2">
                                    <AnimatedCounter value={statistics.totalUsers} />
                                </div>
                                <div className="text-gray-500 uppercase tracking-widest text-sm">
                                    {t('statistics.users', 'Customers')}
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-5xl font-serif font-bold text-[#c5a059] mb-2">
                                    $<AnimatedCounter value={Math.floor(statistics.totalRevenue / 100)} />
                                </div>
                                <div className="text-gray-500 uppercase tracking-widest text-sm">
                                    {t('statistics.revenue', 'Revenue')}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>

            <Footer />

            <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
        </div>
    );
};

export default Home;

