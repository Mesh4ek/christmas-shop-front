import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { apiClient, type Product, getProductImageUrl } from '../utils/api';
import Header from '../components/Header';

const Products = () => {
    const { t, i18n } = useTranslation();
    const { items } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

    useEffect(() => {
        loadProducts();
    }, [i18n.language, page]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const lang = i18n.language === 'uk' ? 'uk' : 'en';
            const result = await apiClient.getProducts(lang, page, 12);
            
            if (result) {
                if (Array.isArray(result)) {
                    const total = result.length;
                    const limit = 12;
                    const totalPages = Math.ceil(total / limit);
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const paginatedProducts = result.slice(startIndex, endIndex);
                    
                    setProducts(paginatedProducts);
                    setPagination({
                        page,
                        limit,
                        total,
                        totalPages,
                    });
                } else if (result.data && Array.isArray(result.data)) {
                    // New paginated format
                    setProducts(result.data);
                    setPagination(result.pagination || null);
                } else {
                    setProducts([]);
                    setPagination(null);
                }
            } else {
                setProducts([]);
                setPagination(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load products');
            setProducts([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const getCartQuantity = (productId: string) => {
        return items.find(item => item.productId === productId)?.quantity || 0;
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center bg-[#faf9f6]">
                    <div className="text-[#2d4033]">{t('products.loading', 'Loading products...')}</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center bg-[#faf9f6]">
                    <div className="text-red-600">{error}</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen pt-20 bg-[#faf9f6]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-12 text-center">
                        {t('products.title', 'Our Products')}
                    </h1>

                    {!products || products.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">{t('products.noProducts', 'No products available')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {products.map((product) => {
                                const cartQuantity = getCartQuantity(product.id);
                                const isOutOfStock = product.stock === 0;

                                return (
                                    <Link key={product.id} to={`/products/${product.id}`} className="group cursor-pointer block">
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
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="bg-white text-[#2d4033] px-4 py-2 uppercase tracking-tighter text-xs font-bold">
                                                        {t('products.outOfStock', 'Out of Stock')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-serif text-xl mb-1 group-hover:text-[#c5a059] transition-colors">
                                                    {product.name}
                                                </h4>
                                                {product.description && (
                                                    <p className="text-gray-400 text-sm italic mb-2 line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="font-medium text-lg text-[#c5a059] ml-4">
                                                {formatPrice(product.priceCents)}
                                            </span>
                                        </div>
                                        {cartQuantity > 0 && (
                                            <div className="text-sm text-[#c5a059] font-medium">
                                                {t('products.inCart', 'In cart')}: {cartQuantity}
                                            </div>
                                        )}
                                        {product.stock > 0 && product.stock < 10 && (
                                            <div className="text-xs text-orange-600 mt-1">
                                                {t('products.lowStock', 'Only {{count}} left', { count: product.stock })}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Always show pagination info and controls */}
                    <div className="flex flex-col items-center mt-12 space-y-4 py-8 border-t border-[#2d4033]/10">
                        {pagination ? (
                            <>
                                <div className="flex justify-center items-center space-x-2 flex-wrap gap-2">
                                    <button
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                        className={`px-3 py-2 rounded-md text-sm ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#c5a059] text-white hover:bg-[#b08d4a]'} transition-colors`}
                                    >
                                        ««
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className={`px-4 py-2 rounded-md ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#c5a059] text-white hover:bg-[#b08d4a]'} transition-colors`}
                                    >
                                        {t('pagination.previous', 'Previous')}
                                    </button>
                                    
                                    {/* Page Numbers */}
                                    <div className="flex space-x-1">
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                            .filter(p => {
                                                // Show first page, last page, current page, and pages around current
                                                return p === 1 || 
                                                       p === pagination.totalPages || 
                                                       (p >= page - 1 && p <= page + 1);
                                            })
                                            .map((p, idx, arr) => {
                                                // Add ellipsis if there's a gap
                                                const showEllipsisBefore = idx > 0 && arr[idx - 1] < p - 1;
                                                return (
                                                    <div key={p} className="flex items-center">
                                                        {showEllipsisBefore && (
                                                            <span className="px-2 text-[#2d4033]">...</span>
                                                        )}
                                                        <button
                                                            onClick={() => setPage(p)}
                                                            className={`px-4 py-2 rounded-md text-sm ${
                                                                page === p
                                                                    ? 'bg-[#c5a059] text-white font-bold'
                                                                    : 'bg-white text-[#2d4033] border border-[#2d4033]/20 hover:bg-[#f0eee9]'
                                                            } transition-colors`}
                                                        >
                                                            {p}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page === pagination.totalPages}
                                        className={`px-4 py-2 rounded-md ${page === pagination.totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#c5a059] text-white hover:bg-[#b08d4a]'} transition-colors`}
                                    >
                                        {t('pagination.next', 'Next')}
                                    </button>
                                    <button
                                        onClick={() => setPage(pagination.totalPages)}
                                        disabled={page === pagination.totalPages}
                                        className={`px-3 py-2 rounded-md text-sm ${page === pagination.totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#c5a059] text-white hover:bg-[#b08d4a]'} transition-colors`}
                                    >
                                        »»
                                    </button>
                                </div>
                                <div className="text-sm text-[#2d4033]/70">
                                    {t('pagination.showing', 'Showing')} {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} {t('pagination.of', 'of')} {pagination.total} {t('pagination.items', 'items')}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-[#2d4033]/70">
                                {products.length} {t('pagination.items', 'items')} {t('pagination.showing', 'Showing')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Products;

