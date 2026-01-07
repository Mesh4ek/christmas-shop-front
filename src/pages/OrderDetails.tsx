import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, getProductImageUrl } from '../utils/api';
import Header from '../components/Header';

interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    unitPriceCents: number;
    product: {
        id: string;
        name: string;
            imageBase64: string | null;
    };
}

interface Order {
    id: string;
    status: 'created' | 'paid' | 'cancelled';
    totalCents: number;
    createdAt: string;
    updatedAt: string;
    orderItems: OrderItem[];
}

const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (id) {
            loadOrder();
        }
    }, [id, isAuthenticated]);

    const loadOrder = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            const data = await apiClient.getOrder(id);
            setOrder(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load order');
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

    const handlePay = async () => {
        if (!order || order.status !== 'created') {
            return;
        }

        setPaying(true);
        setError(null);

        try {
            const updatedOrder = await apiClient.payOrder(order.id);
            setOrder(updatedOrder);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('order.paymentError', 'Failed to process payment');
            setError(errorMessage);
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                setTimeout(() => {
                    loadOrder();
                }, 1000);
            }
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center bg-[#faf9f6]">
                    <div className="text-[#2d4033]">{t('order.loading', 'Loading order...')}</div>
                </div>
            </>
        );
    }

    if (error || !order) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 bg-[#faf9f6]">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <div className="text-center">
                            <h1 className="text-2xl font-serif font-bold text-[#2d4033] mb-4">
                                {t('order.notFound', 'Order not found')}
                            </h1>
                            <p className="text-gray-600 mb-8">{error || t('order.orderNotFound', 'The order you are looking for does not exist.')}</p>
                            <Link
                                to="/orders"
                                className="inline-block bg-[#c5a059] text-white px-6 py-3 rounded-md hover:bg-[#b08d4a] transition-colors"
                            >
                                {t('order.backToOrders', 'Back to Orders')}
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen pt-20 bg-[#faf9f6]">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            to="/orders"
                            className="text-[#2d4033] hover:text-[#c5a059] transition-colors text-sm mb-4 inline-block"
                        >
                            ← {t('order.backToOrders', 'Back to Orders')}
                        </Link>
                        <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-4">
                            {t('order.orderDetails', 'Order Details')}
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">{t('order.orderNumber', 'Order #')}{order.id.slice(0, 8).toUpperCase()}</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                            </span>
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">{t('order.orderDate', 'Order Date')}</h3>
                                <p className="text-[#2d4033]">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">{t('order.status', 'Status')}</h3>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-6 mb-6">
                        <h2 className="text-2xl font-serif font-semibold text-[#2d4033] mb-6">
                            {t('order.items', 'Order Items')}
                        </h2>
                        <div className="space-y-4">
                            {order.orderItems.map((item) => (
                                <div key={item.id} className="flex gap-4 pb-4 border-b border-[#2d4033]/10 last:border-0">
                                    <Link to={`/products/${item.productId}`} className="flex-shrink-0">
                                        <div className="w-24 h-24 overflow-hidden bg-[#f0eee9] rounded">
                                            {item.product.imageBase64 ? (
                                                <img
                                                    src={getProductImageUrl(item.product.imageBase64)}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1">
                                        <Link to={`/products/${item.productId}`}>
                                            <h3 className="font-serif text-lg text-[#2d4033] mb-2 hover:text-[#c5a059] transition-colors">
                                                {item.product.name}
                                            </h3>
                                        </Link>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    {t('order.quantity', 'Quantity')}: {item.quantity}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {t('order.unitPrice', 'Unit Price')}: {formatPrice(item.unitPriceCents)}
                                                </p>
                                            </div>
                                            <p className="text-lg font-medium text-[#c5a059]">
                                                {formatPrice(item.unitPriceCents * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-6">
                        <div className="flex justify-between items-center text-xl font-semibold text-[#2d4033]">
                            <span>{t('order.total', 'Total')}</span>
                            <span className="text-[#c5a059]">{formatPrice(order.totalCents)}</span>
                        </div>
                    </div>

                    {/* Payment Button */}
                    {order.status === 'created' && (
                        <div className="mt-6">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 mb-4">
                                <p className="text-sm mb-4">
                                    {t('order.pendingPayment', 'Your order is pending payment. Please complete the payment to proceed.')}
                                </p>
                            </div>
                            <button
                                onClick={handlePay}
                                disabled={paying}
                                className="w-full bg-green-600 text-white py-4 px-6 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg uppercase tracking-wider"
                            >
                                {paying ? t('order.processing', 'Processing...') : t('order.payNow', 'Pay Now')}
                            </button>
                        </div>
                    )}

                    {/* Success Message */}
                    {order.status === 'paid' && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-green-800">
                            <p className="text-sm font-medium">
                                {t('order.paymentSuccess', '✓ Payment completed successfully!')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderDetails;

