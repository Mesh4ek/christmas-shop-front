import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { apiClient, type Product, getProductImageUrl } from '../utils/api';
import Header from '../components/Header';

const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const { addToCart, items, updateQuantity } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        if (id) {
            loadProduct();
        }
    }, [id, i18n.language]);

    const loadProduct = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            const lang = i18n.language === 'uk' ? 'uk' : 'en';
            const data = await apiClient.getProduct(id, lang);
            setProduct(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const cartItem = product ? items.find(item => item.productId === product.id) : null;
    const cartQuantity = cartItem?.quantity || 0;
    const isOutOfStock = product ? product.stock === 0 : false;
    const maxQuantity = product ? Math.min(product.stock, 99) : 1;

    const handleAddToCart = async () => {
        if (!product) return;

        if (quantity > product.stock) {
            alert(t('productDetails.exceedsStock', 'Cannot add more than available stock'));
            return;
        }

        setAddingToCart(true);
        try {
            if (cartItem) {
                // Replace existing cart item quantity
                updateQuantity(product.id, quantity);
            } else {
                // Add new item to cart
                addToCart(product, quantity);
            }
            // Reset quantity selector to 1 after adding
            setQuantity(1);
            // Show success feedback
            setTimeout(() => setAddingToCart(false), 500);
        } catch (err) {
            setAddingToCart(false);
            alert(t('productDetails.addToCartError', 'Failed to add to cart'));
        }
    };

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity < 1) {
            setQuantity(1);
            return;
        }
        if (newQuantity > maxQuantity) {
            setQuantity(maxQuantity);
            return;
        }
        setQuantity(newQuantity);
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center bg-[#faf9f6]">
                    <div className="text-[#2d4033]">{t('productDetails.loading', 'Loading product...')}</div>
                </div>
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 bg-[#faf9f6]">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <div className="text-center">
                            <h1 className="text-2xl font-serif font-bold text-[#2d4033] mb-4">
                                {t('productDetails.notFound', 'Product not found')}
                            </h1>
                            <p className="text-gray-600 mb-8">{error || t('productDetails.productNotFound', 'The product you are looking for does not exist.')}</p>
                            <Link
                                to="/products"
                                className="inline-block bg-[#c5a059] text-white px-6 py-3 rounded-md hover:bg-[#b08d4a] transition-colors"
                            >
                                {t('productDetails.backToProducts', 'Back to Products')}
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
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Breadcrumb */}
                    <nav className="mb-8 text-sm">
                        <Link to="/" className="text-[#2d4033] hover:text-[#c5a059] transition-colors">
                            {t('productDetails.home', 'Home')}
                        </Link>
                        <span className="mx-2 text-gray-400">/</span>
                        <Link to="/products" className="text-[#2d4033] hover:text-[#c5a059] transition-colors">
                            {t('productDetails.products', 'Products')}
                        </Link>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-gray-600">{product.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Product Image */}
                        <div className="relative">
                            <div className="aspect-square overflow-hidden bg-[#f0eee9] rounded-lg">
                                {product.imageBase64 ? (
                                    <img
                                        src={getProductImageUrl(product.imageBase64)}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <svg className="w-32 h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {isOutOfStock && (
                                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded uppercase text-xs font-bold">
                                    {t('products.outOfStock', 'Out of Stock')}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-4">
                                {product.name}
                            </h1>

                            <div className="text-3xl font-medium text-[#c5a059] mb-6">
                                {formatPrice(product.priceCents)}
                            </div>

                            {product.description && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-serif font-semibold text-[#2d4033] mb-3">
                                        {t('productDetails.description', 'Description')}
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Stock Info */}
                            <div className="mb-6">
                                {product.stock > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            {t('productDetails.stock', 'Stock')}:
                                        </span>
                                        {product.stock < 10 ? (
                                            <span className="text-sm font-medium text-orange-600">
                                                {t('productDetails.lowStock', 'Only {{count}} left', { count: product.stock })}
                                            </span>
                                        ) : (
                                            <span className="text-sm font-medium text-green-600">
                                                {t('productDetails.inStock', 'In Stock')} ({product.stock})
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm font-medium text-red-600">
                                        {t('products.outOfStock', 'Out of Stock')}
                                    </span>
                                )}
                            </div>

                            {/* Cart Quantity Display */}
                            {cartQuantity > 0 && (
                                <div className="mb-4 p-3 bg-[#c5a059]/10 border border-[#c5a059]/20 rounded">
                                    <p className="text-sm text-[#2d4033]">
                                        {t('productDetails.inCart', '{{count}} in cart', { count: cartQuantity })}
                                    </p>
                                </div>
                            )}

                            {/* Quantity Selector and Add to Cart */}
                            {!isOutOfStock && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <label className="text-sm font-medium text-[#2d4033]">
                                            {t('productDetails.quantity', 'Quantity')}:
                                        </label>
                                        <div className="flex items-center border border-[#2d4033]/20 rounded">
                                            <button
                                                onClick={() => handleQuantityChange(quantity - 1)}
                                                disabled={quantity <= 1}
                                                className="px-4 py-2 hover:bg-[#2d4033]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max={maxQuantity}
                                                value={quantity}
                                                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                                className="w-20 px-4 py-2 text-center border-x border-[#2d4033]/20 focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(quantity + 1)}
                                                disabled={quantity >= maxQuantity}
                                                className="px-4 py-2 hover:bg-[#2d4033]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={addingToCart || quantity > product.stock || quantity < 1}
                                        className="w-full bg-[#c5a059] text-white py-4 px-6 rounded-md hover:bg-[#b08d4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg uppercase tracking-wider"
                                    >
                                        {addingToCart
                                            ? t('productDetails.adding', 'Adding...')
                                            : cartQuantity > 0
                                            ? t('productDetails.updateCart', 'Update Cart')
                                            : t('productDetails.addToCart', 'Add to Cart')}
                                    </button>

                                    {quantity > product.stock && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {t('productDetails.exceedsStock', 'Cannot add more than available stock')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="mt-auto pt-8 border-t border-[#2d4033]/10">
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p>
                                        <span className="font-medium">{t('productDetails.sku', 'SKU')}:</span> {product.id.slice(0, 8).toUpperCase()}
                                    </p>
                                    <p>
                                        <span className="font-medium">{t('productDetails.added', 'Added')}:</span>{' '}
                                        {new Date(product.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductDetails;

