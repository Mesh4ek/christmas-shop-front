import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';

const CartAuthSync = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { setUserId } = useCart();

    useEffect(() => {
        setUserId(user?.id || null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    return <>{children}</>;
};

const LogoutRedirect = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const wasAuthenticated = useRef(isAuthenticated);

    useEffect(() => {
        if (wasAuthenticated.current && !isAuthenticated) {
            navigate('/', { replace: true });
        }
        wasAuthenticated.current = isAuthenticated;
    }, [isAuthenticated, navigate]);

    return <>{children}</>;
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <CartAuthSync>
                        <LogoutRedirect>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/products/:id" element={<ProductDetails />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/orders" element={<Orders />} />
                                <Route path="/orders/:id" element={<OrderDetails />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/products" element={<AdminProducts />} />
                                <Route path="/admin/orders" element={<AdminOrders />} />
                            </Routes>
                        </LogoutRedirect>
                    </CartAuthSync>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
