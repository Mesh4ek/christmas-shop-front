import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface CartItem {
    productId: string;
    name: string;
    priceCents: number;
    imageBase64?: string | null;
    quantity: number;
    stock: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: { id: string; name: string; priceCents: number; imageBase64?: string | null; stock: number }, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
    setUserId: (userId: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to get cart key for a user
const getCartKey = (userId: string | null) => {
    return userId ? `cart_${userId}` : 'cart_guest';
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [userId, setUserIdState] = useState<string | null>(null);
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        const cartKey = getCartKey(userId);
        const saved = localStorage.getItem(cartKey);
        setItems(saved ? JSON.parse(saved) : []);
    }, [userId]);

    useEffect(() => {
        if (userId !== null) {
            const cartKey = getCartKey(userId);
            localStorage.setItem(cartKey, JSON.stringify(items));
        }
    }, [items, userId]);

    const setUserId = useCallback((newUserId: string | null) => {
        setItems((currentItems) => {
            if (userId !== null) {
                const currentCartKey = getCartKey(userId);
                localStorage.setItem(currentCartKey, JSON.stringify(currentItems));
            }
            return [];
        });
        setUserIdState(newUserId);
    }, [userId]);

    const addToCart = (product: { id: string; name: string; priceCents: number; imageBase64?: string | null; stock: number }, quantity: number = 1) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find(item => item.productId === product.id);
            
            if (existingItem) {
                // Replace quantity instead of adding
                if (quantity > product.stock) {
                    return prevItems;
                }
                return prevItems.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: quantity }
                        : item
                );
            }
            
            return [...prevItems, {
                productId: product.id,
                name: product.name,
                priceCents: product.priceCents,
                imageBase64: product.imageBase64,
                quantity,
                stock: product.stock,
            }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems((prevItems) => prevItems.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        setItems((prevItems) => {
            return prevItems.map(item => {
                if (item.productId === productId) {
                    if (quantity > item.stock) {
                        return item;
                    }
                    return { ...item, quantity };
                }
                return item;
            });
        });
    };

    const clearCart = () => {
        setItems([]);
    };

    const getTotalPrice = () => {
        return items.reduce((total, item) => total + (item.priceCents * item.quantity), 0);
    };

    const getTotalItems = () => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getTotalItems,
                setUserId,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

