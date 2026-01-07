import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, getProductImageUrl } from '../utils/api';
import Header from '../components/Header';

interface AdminOrder {
    id: string;
    status: 'created' | 'paid' | 'cancelled';
    totalCents: number;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        email: string;
        name?: string;
        surname?: string;
    };
    orderItems: Array<{
        id: string;
        productId: string;
        quantity: number;
        unitPriceCents: number;
        product: {
            id: string;
            name: string;
            imageBase64: string | null;
        };
    }>;
}

const AdminOrders = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        loadOrders();
    }, [user, navigate, page, i18n.language]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const lang = i18n.language === 'uk' ? 'uk' : 'en';
            const result = await apiClient.getAllOrders(page, 15, lang);
            
            if (result && result.data && Array.isArray(result.data)) {
                setOrders(result.data);
                setPagination(result.pagination || null);
            } else if (Array.isArray(result)) {
                const total = result.length;
                const limit = 15;
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

    const handleStatusChange = async (orderId: string, newStatus: 'created' | 'paid' | 'cancelled') => {
        try {
            setUpdatingStatus(orderId);
            await apiClient.updateOrderStatus(orderId, newStatus);
            loadOrders();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update order status');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

    if (user?.role !== 'admin') {
        return null;
    }

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center bg-[#faf9f6]">
                    <div className="text-[#2d4033]">{t('admin.loading', 'Loading...')}</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen pt-20 bg-[#faf9f6]">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <div className="mb-8">
                        <Link to="/admin" className="text-[#c5a059] hover:text-[#b08d4a] mb-4 inline-block">
                            ← {t('admin.backToDashboard', 'Back to Dashboard')}
                        </Link>
                        <h1 className="text-4xl font-serif font-bold text-[#2d4033]">
                            {t('admin.orders', 'Orders')}
                        </h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-12 text-center">
                                <p className="text-gray-500 text-lg">{t('admin.noOrders', 'No orders found')}</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-6"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-xl font-serif font-semibold text-[#2d4033] mb-1">
                                                {t('order.orderNumber', 'Order #')}{order.id.slice(0, 8).toUpperCase()}
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                {t('admin.customer', 'Customer')}: {order.user.name || order.user.email}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {t('order.orderDate', 'Order Date')}: {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="mb-2">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value as 'created' | 'paid' | 'cancelled')}
                                                    disabled={updatingStatus === order.id}
                                                    className={`px-3 py-1 rounded text-sm font-medium border ${getStatusColor(order.status)} ${
                                                        updatingStatus === order.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                                    }`}
                                                >
                                                    <option value="created">{t('order.created', 'Created')}</option>
                                                    <option value="paid">{t('order.paid', 'Paid')}</option>
                                                    <option value="cancelled">{t('order.cancelled', 'Cancelled')}</option>
                                                </select>
                                            </div>
                                            <p className="text-2xl font-bold text-[#c5a059]">
                                                {formatPrice(order.totalCents)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#2d4033]/10 pt-4 mt-4">
                                        <h3 className="text-sm font-semibold text-[#2d4033] mb-3">
                                            {t('order.items', 'Order Items')}
                                        </h3>
                                        <div className="space-y-2">
                                            {order.orderItems.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-3">
                                                        {item.product.imageBase64 && (
                                                            <img
                                                                src={getProductImageUrl(item.product.imageBase64)}
                                                                alt={item.product.name}
                                                                className="w-10 h-10 object-cover rounded"
                                                            />
                                                        )}
                                                        <div>
                                                            <span className="font-medium text-[#2d4033]">{item.product.name}</span>
                                                            <span className="text-gray-500 ml-2">
                                                                x{item.quantity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[#2d4033]">
                                                        {formatPrice(item.unitPriceCents * item.quantity)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

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

export default AdminOrders;

