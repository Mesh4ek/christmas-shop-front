import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, getProductImageUrl } from '../utils/api';
import Header from '../components/Header';

const Cart = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart();
    const { isAuthenticated } = useAuth();
    const [checkingOut, setCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        const item = items.find(i => i.productId === productId);
        if (item && newQuantity > item.stock) {
            return; // Don't allow exceeding stock
        }
        updateQuantity(productId, newQuantity);
    };

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        if (items.length === 0) {
            setError(t('cart.emptyCart', 'Your cart is empty'));
            return;
        }

        setCheckingOut(true);
        setError(null);

        try {
            const orderItems = items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            }));

            const order = await apiClient.createOrder(orderItems);
            
            clearCart();
            
            // Navigate to order confirmation or orders page
            navigate(`/orders/${order.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('cart.checkoutError', 'Failed to create order. Please try again.'));
        } finally {
            setCheckingOut(false);
        }
    };

    if (items.length === 0) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 bg-[#faf9f6]">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-8 text-center">
                            {t('cart.title', 'Shopping Cart')}
                        </h1>
                        <div className="text-center py-20">
                            <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="text-gray-500 text-lg mb-8">{t('cart.empty', 'Your cart is empty')}</p>
                            <Link
                                to="/products"
                                className="inline-block bg-[#c5a059] text-white px-8 py-3 rounded-md hover:bg-[#b08d4a] transition-colors uppercase tracking-wider text-sm font-medium"
                            >
                                {t('cart.continueShopping', 'Continue Shopping')}
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const subtotal = getTotalPrice();
    const totalItems = getTotalItems();

    return (
        <>
            <Header />
            <div className="min-h-screen pt-20 bg-[#faf9f6]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-8">
                        {t('cart.title', 'Shopping Cart')}
                    </h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 divide-y divide-[#2d4033]/10">
                                {items.map((item) => (
                                    <div key={item.productId} className="p-6 flex flex-col sm:flex-row gap-6">
                                        {/* Product Image */}
                                        <Link to={`/products/${item.productId}`} className="flex-shrink-0">
                                            <div className="w-32 h-32 overflow-hidden bg-[#f0eee9] rounded">
                                                {item.imageBase64 ? (
                                                    <img
                                                        src={getProductImageUrl(item.imageBase64)}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Product Info */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <Link to={`/products/${item.productId}`}>
                                                    <h3 className="font-serif text-xl text-[#2d4033] mb-2 hover:text-[#c5a059] transition-colors">
                                                        {item.name}
                                                    </h3>
                                                </Link>
                                                <p className="text-lg font-medium text-[#c5a059] mb-4">
                                                    {formatPrice(item.priceCents)}
                                                </p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-4">
                                                <label className="text-sm font-medium text-[#2d4033]">
                                                    {t('cart.quantity', 'Quantity')}:
                                                </label>
                                                <div className="flex items-center border border-[#2d4033]/20 rounded">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                        className="px-3 py-1 hover:bg-[#2d4033]/5 transition-colors"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.stock}
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 1;
                                                            handleQuantityChange(item.productId, val);
                                                        }}
                                                        className="w-16 px-3 py-1 text-center border-x border-[#2d4033]/20 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                                                    />
                                                    <button
                                                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stock}
                                                        className="px-3 py-1 hover:bg-[#2d4033]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {t('cart.maxStock', 'Max: {{count}}', { count: item.stock })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Item Total & Remove */}
                                        <div className="flex flex-col items-end justify-between">
                                            <button
                                                onClick={() => removeFromCart(item.productId)}
                                                className="text-red-600 hover:text-red-800 transition-colors mb-4"
                                                title={t('cart.remove', 'Remove item')}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 mb-1">{t('cart.itemTotal', 'Item Total')}</p>
                                                <p className="text-xl font-medium text-[#2d4033]">
                                                    {formatPrice(item.priceCents * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-6 sticky top-24">
                                <h2 className="text-2xl font-serif font-semibold text-[#2d4033] mb-6">
                                    {t('cart.orderSummary', 'Order Summary')}
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>{t('cart.subtotal', 'Subtotal')} ({totalItems} {totalItems === 1 ? t('cart.item', 'item') : t('cart.items', 'items')})</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>{t('cart.shipping', 'Shipping')}</span>
                                        <span className="font-medium">{t('cart.calculatedAtCheckout', 'Calculated at checkout')}</span>
                                    </div>
                                    <div className="border-t border-[#2d4033]/10 pt-4 flex justify-between text-xl font-semibold text-[#2d4033]">
                                        <span>{t('cart.total', 'Total')}</span>
                                        <span className="text-[#c5a059]">{formatPrice(subtotal)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={checkingOut || items.length === 0}
                                    className="w-full bg-[#c5a059] text-white py-4 px-6 rounded-md hover:bg-[#b08d4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg uppercase tracking-wider mb-4"
                                >
                                    {checkingOut
                                        ? t('cart.processing', 'Processing...')
                                        : isAuthenticated
                                        ? t('cart.checkout', 'Proceed to Checkout')
                                        : t('cart.loginToCheckout', 'Login to Checkout')}
                                </button>

                                <Link
                                    to="/products"
                                    className="block text-center text-[#2d4033] hover:text-[#c5a059] transition-colors text-sm"
                                >
                                    {t('cart.continueShopping', 'Continue Shopping')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Cart;

