import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, type Product, getProductImageUrl } from '../utils/api';
import Header from '../components/Header';

const AdminProducts = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
    const [formData, setFormData] = useState({
        nameEn: '',
        nameUk: '',
        descriptionEn: '',
        descriptionUk: '',
        priceCents: '',
        imageBase64: '',
        stock: '',
        isActive: true,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
    const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        loadProducts();
    }, [user, navigate, showInactive, page]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiClient.getAllProducts(showInactive, undefined, page, 15);
            
            if (result && result.data && Array.isArray(result.data)) {
                setProducts(result.data);
                setPagination(result.pagination || null);
            } else if (Array.isArray(result)) {
                const total = result.length;
                const limit = 15;
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

    const handleCreate = () => {
        setEditingProduct(null);
        setFormData({
            nameEn: '',
            nameUk: '',
            descriptionEn: '',
            descriptionUk: '',
            priceCents: '',
            imageBase64: '',
            stock: '',
            isActive: true,
        });
        setFormErrors({});
        setFormTouched({});
        setShowCreateModal(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            nameEn: product.nameEn || product.name || '',
            nameUk: product.nameUk || product.name || '',
            descriptionEn: product.descriptionEn || product.description || '',
            descriptionUk: product.descriptionUk || product.description || '',
            priceCents: (product.priceCents / 100).toFixed(2),
            imageBase64: product.imageBase64 || '',
            stock: product.stock.toString(),
            isActive: product.isActive,
        });
        setFormErrors({});
        setFormTouched({});
        setShowCreateModal(true);
    };

    // Validation functions
    const validateNameEn = (name: string): string | undefined => {
        const trimmed = name.trim();
        if (!trimmed) {
            return t('admin.validation.nameEn_required', 'Name (English) is required');
        }
        if (trimmed.length < 2) {
            return t('admin.validation.nameEn_too_short', 'Name (English) must be at least 2 characters long');
        }
        if (trimmed.length > 100) {
            return t('admin.validation.nameEn_too_long', 'Name (English) must be less than 100 characters');
        }
        return undefined;
    };

    const validateNameUk = (name: string): string | undefined => {
        const trimmed = name.trim();
        if (!trimmed) {
            return t('admin.validation.nameUk_required', 'Name (Ukrainian) is required');
        }
        if (trimmed.length < 2) {
            return t('admin.validation.nameUk_too_short', 'Name (Ukrainian) must be at least 2 characters long');
        }
        if (trimmed.length > 100) {
            return t('admin.validation.nameUk_too_long', 'Name (Ukrainian) must be less than 100 characters');
        }
        return undefined;
    };

    const validateDescriptionEn = (desc: string): string | undefined => {
        if (!desc || desc.trim() === '') return undefined; // Optional
        if (desc.length > 2000) {
            return t('admin.validation.descriptionEn_too_long', 'Description (English) must be less than 2000 characters');
        }
        return undefined;
    };

    const validateDescriptionUk = (desc: string): string | undefined => {
        if (!desc || desc.trim() === '') return undefined; // Optional
        if (desc.length > 2000) {
            return t('admin.validation.descriptionUk_too_long', 'Description (Ukrainian) must be less than 2000 characters');
        }
        return undefined;
    };

    const validatePrice = (price: string): string | undefined => {
        if (!price || price.trim() === '') {
            return t('admin.validation.price_required', 'Price is required');
        }
        const numValue = parseFloat(price);
        if (isNaN(numValue)) {
            return t('admin.validation.price_invalid', 'Price must be a valid number');
        }
        if (numValue <= 0) {
            return t('admin.validation.price_positive', 'Price must be greater than 0');
        }
        if (numValue > 999999.99) {
            return t('admin.validation.price_too_large', 'Price is too large (max $999,999.99)');
        }
        return undefined;
    };

    const validateStock = (stock: string): string | undefined => {
        if (!stock || stock.trim() === '') {
            return t('admin.validation.stock_required', 'Stock is required');
        }
        const numValue = parseInt(stock);
        if (isNaN(numValue)) {
            return t('admin.validation.stock_invalid', 'Stock must be a valid integer');
        }
        if (numValue < 0) {
            return t('admin.validation.stock_negative', 'Stock cannot be negative');
        }
        if (numValue > 999999) {
            return t('admin.validation.stock_too_large', 'Stock is too large (max 999,999)');
        }
        return undefined;
    };

    const validateImageBase64 = (image: string): string | undefined => {
        if (!image || image.trim() === '') return undefined; // Optional
        const trimmed = image.trim();
        // Check if it's a valid base64 string or data URL
        if (trimmed.startsWith('data:image/')) {
            const base64Part = trimmed.split(',')[1];
            if (!base64Part) {
                return t('admin.validation.image_invalid', 'Invalid base64 image format');
            }
            if (!/^[A-Za-z0-9+/=]+$/.test(base64Part)) {
                return t('admin.validation.image_invalid', 'Invalid base64 image format');
            }
        } else {
            if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
                return t('admin.validation.image_invalid', 'Invalid base64 image format');
            }
        }
        return undefined;
    };

    const validateField = (fieldName: string, value: string): void => {
        let error: string | undefined;
        
        switch (fieldName) {
            case 'nameEn':
                error = validateNameEn(value);
                break;
            case 'nameUk':
                error = validateNameUk(value);
                break;
            case 'descriptionEn':
                error = validateDescriptionEn(value);
                break;
            case 'descriptionUk':
                error = validateDescriptionUk(value);
                break;
            case 'priceCents':
                error = validatePrice(value);
                break;
            case 'stock':
                error = validateStock(value);
                break;
            case 'imageBase64':
                error = validateImageBase64(value);
                break;
        }

        setFormErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormTouched(prev => ({ ...prev, [name]: true }));
        validateField(name, value);
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateAll = (): boolean => {
        const errors: Record<string, string | undefined> = {};
        
        errors.nameEn = validateNameEn(formData.nameEn);
        errors.nameUk = validateNameUk(formData.nameUk);
        errors.descriptionEn = validateDescriptionEn(formData.descriptionEn);
        errors.descriptionUk = validateDescriptionUk(formData.descriptionUk);
        errors.priceCents = validatePrice(formData.priceCents);
        errors.stock = validateStock(formData.stock);
        errors.imageBase64 = validateImageBase64(formData.imageBase64);

        setFormErrors(errors);
        setFormTouched({
            nameEn: true,
            nameUk: true,
            descriptionEn: true,
            descriptionUk: true,
            priceCents: true,
            stock: true,
            imageBase64: true,
        });

        return !Object.values(errors).some(error => error !== undefined);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateAll()) {
            setError(t('admin.validation.fix_errors', 'Please fix the errors below'));
            return;
        }

        try {
            const priceValue = parseFloat(formData.priceCents);
            const stockValue = parseInt(formData.stock);

            const data = {
                nameEn: formData.nameEn.trim(),
                nameUk: formData.nameUk.trim(),
                descriptionEn: formData.descriptionEn.trim() || undefined,
                descriptionUk: formData.descriptionUk.trim() || undefined,
                priceCents: Math.round(priceValue * 100),
                imageBase64: formData.imageBase64.trim() || undefined,
                stock: stockValue,
                isActive: formData.isActive,
            };

            if (editingProduct) {
                await apiClient.updateProduct(editingProduct.id, data);
            } else {
                await apiClient.createProduct(data);
            }

            setShowCreateModal(false);
            setFormErrors({});
            setFormTouched({});
            loadProducts();
        } catch (err: any) {
            const errorData = err.response?.data || err.data || {};
            
            if (errorData.errors && Array.isArray(errorData.errors)) {
                const backendErrors = errorData.errors;
                const fieldErrors: Record<string, string> = {};
                backendErrors.forEach((error: { field: string; message: string }) => {
                    fieldErrors[error.field] = error.message;
                });
                setFormErrors(fieldErrors);
                setError(errorData.error || t('admin.validation.fix_errors', 'Please fix the errors below'));
            } else {
                setError(errorData.error || err.message || 'Failed to save product');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('admin.confirmDelete', 'Are you sure you want to delete this product?'))) {
            return;
        }

        try {
            await apiClient.deleteProduct(id);
            loadProducts();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        }
    };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
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
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <Link to="/admin" className="text-[#c5a059] hover:text-[#b08d4a] mb-4 inline-block">
                                ← {t('admin.backToDashboard', 'Back to Dashboard')}
                            </Link>
                            <h1 className="text-4xl font-serif font-bold text-[#2d4033]">
                                {t('admin.products', 'Products')}
                            </h1>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showInactive}
                                    onChange={(e) => setShowInactive(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">{t('admin.showInactive', 'Show Inactive')}</span>
                            </label>
                            <button
                                onClick={handleCreate}
                                className="bg-[#c5a059] text-white px-6 py-2 rounded-md hover:bg-[#b08d4a] transition-colors"
                            >
                                {t('admin.createProduct', 'Create Product')}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#faf9f6] border-b border-[#2d4033]/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#2d4033]">{t('admin.name', 'Name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#2d4033]">{t('admin.price', 'Price')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#2d4033]">{t('admin.stock', 'Stock')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#2d4033]">{t('admin.status', 'Status')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#2d4033]">{t('admin.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-b border-[#2d4033]/10 hover:bg-[#faf9f6]">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {product.imageBase64 && (
                                                    <img src={getProductImageUrl(product.imageBase64)} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                                )}
                                                <div>
                                                    <div className="font-medium text-[#2d4033]">{product.name}</div>
                                                    {product.description && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#2d4033]">{formatPrice(product.priceCents)}</td>
                                        <td className="px-6 py-4 text-[#2d4033]">{product.stock}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                product.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {product.isActive ? t('admin.active', 'Active') : t('admin.inactive', 'Inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-[#c5a059] hover:text-[#b08d4a] text-sm"
                                                >
                                                    {t('admin.edit', 'Edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    {t('admin.delete', 'Delete')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Always show pagination info and controls */}
                    {pagination && (
                        <div className="flex flex-col items-center mt-6 pb-6 space-y-4 border-t border-[#2d4033]/10 pt-6">
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

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#2d4033]/10">
                            <h2 className="text-2xl font-serif font-semibold text-[#2d4033]">
                                {editingProduct ? t('admin.editProduct', 'Edit Product') : t('admin.createProduct', 'Create Product')}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#2d4033] mb-1">
                                            {t('admin.nameEn', 'Name (English)')} *
                                        </label>
                                        <input
                                            name="nameEn"
                                            type="text"
                                            required
                                            value={formData.nameEn}
                                            onChange={handleFieldChange}
                                            onBlur={handleFieldBlur}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none transition-colors ${
                                                formErrors.nameEn ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059]'
                                            }`}
                                        />
                                        {formErrors.nameEn && formTouched.nameEn && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.nameEn}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2d4033] mb-1">
                                            {t('admin.nameUk', 'Name (Ukrainian)')} *
                                        </label>
                                        <input
                                            name="nameUk"
                                            type="text"
                                            required
                                            value={formData.nameUk}
                                            onChange={handleFieldChange}
                                            onBlur={handleFieldBlur}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none transition-colors ${
                                                formErrors.nameUk ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059]'
                                            }`}
                                        />
                                        {formErrors.nameUk && formTouched.nameUk && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.nameUk}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#2d4033] mb-1">
                                            {t('admin.descriptionEn', 'Description (English)')}
                                        </label>
                                        <textarea
                                            name="descriptionEn"
                                            value={formData.descriptionEn}
                                            onChange={handleFieldChange}
                                            onBlur={handleFieldBlur}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none transition-colors ${
                                                formErrors.descriptionEn ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059]'
                                            }`}
                                            rows={3}
                                        />
                                        {formErrors.descriptionEn && formTouched.descriptionEn && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.descriptionEn}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2d4033] mb-1">
                                            {t('admin.descriptionUk', 'Description (Ukrainian)')}
                                        </label>
                                        <textarea
                                            name="descriptionUk"
                                            value={formData.descriptionUk}
                                            onChange={handleFieldChange}
                                            onBlur={handleFieldBlur}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none transition-colors ${
                                                formErrors.descriptionUk ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059]'
                                            }`}
                                            rows={3}
                                        />
                                        {formErrors.descriptionUk && formTouched.descriptionUk && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.descriptionUk}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#2d4033] mb-1">
                                            {t('admin.price', 'Price')} ($) *
                                        </label>
                                        <input
                                            name="priceCents"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            value={formData.priceCents}
                                            onChange={handleFieldChange}
                                            onBlur={handleFieldBlur}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none transition-colors ${
                                                formErrors.priceCents ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059]'
                                            }`}
                                        />
                                        {formErrors.priceCents && formTouched.priceCents && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.priceCents}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2d4033] mb-1">
                                            {t('admin.stock', 'Stock')} *
                                        </label>
                                        <input
                                            name="stock"
                                            type="number"
                                            min="0"
                                            required
                                            value={formData.stock}
                                            onChange={handleFieldChange}
                                            onBlur={handleFieldBlur}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none transition-colors ${
                                                formErrors.stock ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059]'
                                            }`}
                                        />
                                        {formErrors.stock && formTouched.stock && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.stock}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#2d4033] mb-1">
                                        {t('admin.imageUrl', 'Image URL')}
                                    </label>
                                    <input
                                        name="imageBase64"
                                        type="text"
                                        value={formData.imageBase64}
                                        onChange={handleFieldChange}
                                        onBlur={handleFieldBlur}
                                        placeholder="data:image/png;base64,... or paste base64 string"
                                        className={`w-full px-4 py-2 border rounded-md focus:outline-none transition-colors ${
                                            formErrors.imageBase64 ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#2d4033]/20 focus:ring-2 focus:ring-[#c5a059]'
                                        }`}
                                    />
                                    {formErrors.imageBase64 && formTouched.imageBase64 && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.imageBase64}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-[#2d4033]">{t('admin.active', 'Active')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#c5a059] text-white px-6 py-2 rounded-md hover:bg-[#b08d4a] transition-colors"
                                >
                                    {editingProduct ? t('admin.update', 'Update') : t('admin.create', 'Create')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    {t('admin.cancel', 'Cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminProducts;

