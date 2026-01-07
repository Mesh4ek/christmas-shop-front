import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    if (user?.role !== 'admin') {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-20 flex items-center justify-center bg-[#faf9f6]">
                    <div className="text-red-600 text-center">
                        <h1 className="text-2xl font-bold mb-4">{t('admin.unauthorized', 'Unauthorized')}</h1>
                        <p>{t('admin.adminAccessRequired', 'Admin access required')}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen pt-20 bg-[#faf9f6]">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <h1 className="text-4xl font-serif font-bold text-[#2d4033] mb-8 text-center">
                        {t('admin.dashboard', 'Admin Dashboard')}
                    </h1>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Products Management Card */}
                        <Link
                            to="/admin/products"
                            className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-8 hover:border-[#c5a059] hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-serif font-semibold text-[#2d4033]">
                                    {t('admin.products', 'Products')}
                                </h2>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c5a059]">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                    <path d="M3 6h18" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                            </div>
                            <p className="text-gray-600 mb-4">
                                {t('admin.manageProducts', 'Manage product catalog, prices, stock, and availability')}
                            </p>
                            <div className="text-[#c5a059] font-medium">
                                {t('admin.manage', 'Manage')} →
                            </div>
                        </Link>

                        {/* Orders Management Card */}
                        <Link
                            to="/admin/orders"
                            className="bg-white rounded-lg shadow-sm border border-[#2d4033]/10 p-8 hover:border-[#c5a059] hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-serif font-semibold text-[#2d4033]">
                                    {t('admin.orders', 'Orders')}
                                </h2>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c5a059]">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                    <rect width="8" height="12" x="8" y="6" rx="1" />
                                </svg>
                            </div>
                            <p className="text-gray-600 mb-4">
                                {t('admin.manageOrders', 'View all orders, update statuses, and track customer purchases')}
                            </p>
                            <div className="text-[#c5a059] font-medium">
                                {t('admin.manage', 'Manage')} →
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;

