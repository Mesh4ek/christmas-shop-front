import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import Header from '../components/Header';

interface Order {
    id: string;
    status: 'created' | 'paid' | 'cancelled';
    totalCents: number;
    createdAt: string;
    updatedAt: string;
}

const Orders = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadOrders();
    }, [isAuthenticated, navigate, page, i18n.language]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const lang = i18n.language === 'uk' ? 'uk' : 'en';
            const result = await apiClient.getMyOrders(page, 10, lang);
            
            if (result && result.data && Array.isArray(result.data)) {
                setOrders(result.data);
                setPagination(result.pagination || null);
            } else if (Array.isArray(result)) {
                const total = result.length;
                const limit = 10;
                const totalPages = Math.ceil(total / limit);
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedOrders = result.slice(startIndex, endIndex);
                
                setOrders(paginatedOrders);
                setPagination({
                    page,
                    limit,
                    total,
                    totalPages,
                });
            } else {
                setOrders([]);
                setPagination(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load orders');
            setOrders([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'created':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid':
                return t('order.paid', 'Paid');
            case 'cancelled':
                return t('order.cancelled', 'Cancelled');
            case 'created':
            default:
                return t('order.created', 'Created');
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center bg-[#faf9f6]">
                    <div className="text-[#2d4033]">{t('order.loading', 'Loading orders...')}</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen pt-20 bg-[#faf9f6]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-8">
                        {t('order.myOrders', 'My Orders')}
                    </h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-12 text-center">
                            <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="text-gray-500 text-lg mb-8">{t('order.noOrders', 'You have no orders yet.')}</p>
                            <Link
                                to="/products"
                                className="inline-block bg-[#c5a059] text-white px-8 py-3 rounded-md hover:bg-[#b08d4a] transition-colors uppercase tracking-wider text-sm font-medium"
                            >
                                {t('order.startShopping', 'Start Shopping')}
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <Link
                                    key={order.id}
                                    to={`/orders/${order.id}`}
                                    className="block bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-6 hover:border-[#c5a059] hover:shadow-md transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-medium text-[#2d4033]">
                                                    {t('order.orderNumber', 'Order #')}{order.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {t('order.orderDate', 'Order Date')}: {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-semibold text-[#c5a059]">
                                                {formatPrice(order.totalCents)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Always show pagination info and controls */}
                    {pagination && (
                        <div className="flex flex-col items-center mt-12 space-y-4 py-8 border-t border-[#2d4033]/10">
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
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Orders;

