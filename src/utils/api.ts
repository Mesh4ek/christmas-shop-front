const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get the image source for a product
 * If imageBase64 is provided, return it directly (it's already a data URL)
 * Otherwise return empty string for placeholder
 */
export function getProductImageUrl(imageBase64: string | null | undefined): string {
    if (!imageBase64) return '';
    // Base64 images are already data URLs (data:image/png;base64,...)
    // Just return them as-is
    return imageBase64;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
    surname?: string;
    phone?: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name?: string;
        surname?: string;
        role: string;
    };
    token: string;
}

class ApiClient {
    getAuthToken(): string | null {
        return localStorage.getItem('authToken');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getAuthToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: 'An error occurred',
            }));
            const error = new Error(errorData.error || 'Request failed') as any;
            error.response = { data: errorData };
            error.data = errorData;
            throw error;
        }

        // Handle 204 No Content responses (no body to parse)
        if (response.status === 204) {
            return null as unknown as T;
        }

        // Check if response has content to parse
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (!text || text.trim() === '') {
                return null as unknown as T;
            }
            return JSON.parse(text) as T;
        }

        return null as unknown as T;
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getProfile() {
        return this.request('/api/auth/profile');
    }

    async updateProfile(data: { name?: string; surname?: string; phone?: string }) {
        return this.request('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async updatePassword(currentPassword: string, newPassword: string) {
        return this.request('/api/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    setAuth(token: string, user: any) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    getStoredUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isAuthenticated(): boolean {
        return !!this.getAuthToken();
    }

    async getProducts(lang?: string, page?: number, limit?: number, excludeOutOfStock?: boolean) {
        const params = new URLSearchParams();
        if (lang) params.append('lang', lang);
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        if (excludeOutOfStock) params.append('excludeOutOfStock', 'true');
        const queryString = params.toString();
        const url = `/api/products${queryString ? `?${queryString}` : ''}`;
        const result = await this.request<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(url);
        if (!result) {
            throw new Error('Invalid response from server');
        }
        return result;
    }

    async getProduct(id: string, lang?: string) {
        const langParam = lang ? `?lang=${lang}` : '';
        return this.request<Product>(`/api/products/${id}${langParam}`);
    }

    async createOrder(items: { productId: string; quantity: number }[]) {
        return this.request<{ id: string; status: string; totalCents: number; createdAt: string; orderItems: any[] }>('/api/orders', {
            method: 'POST',
            body: JSON.stringify({ items }),
        });
    }

    async getOrder(id: string) {
        return this.request<{
            id: string;
            status: 'created' | 'paid' | 'cancelled';
            totalCents: number;
            createdAt: string;
            updatedAt: string;
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
        }>(`/api/orders/${id}`);
    }

    async getMyOrders(page?: number, limit?: number, lang?: string) {
        const params = new URLSearchParams();
        if (lang) params.append('lang', lang);
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        const queryString = params.toString();
        const url = `/api/orders/my${queryString ? `?${queryString}` : ''}`;
        const result = await this.request<{ 
            data: Array<{
                id: string;
                status: 'created' | 'paid' | 'cancelled';
                totalCents: number;
                createdAt: string;
                updatedAt: string;
            }>;
            pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(url);
        if (!result) {
            throw new Error('Invalid response from server');
        }
        return result;
    }

    async payOrder(id: string) {
        return this.request<{
            id: string;
            status: 'created' | 'paid' | 'cancelled';
            totalCents: number;
            createdAt: string;
            updatedAt: string;
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
        }>(`/api/orders/${id}/pay`, {
            method: 'POST',
        });
    }

    // Admin methods
    async getAllProducts(includeInactive: boolean = false, lang?: string, page?: number, limit?: number) {
        const params = new URLSearchParams();
        if (includeInactive) params.append('includeInactive', 'true');
        if (lang) params.append('lang', lang);
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        const queryString = params.toString();
        const url = `/api/products${queryString ? `?${queryString}` : ''}`;
        const result = await this.request<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(url);
        if (!result) {
            throw new Error('Invalid response from server');
        }
        return result;
    }

    async createProduct(data: {
        nameEn: string;
        nameUk: string;
        descriptionEn?: string;
        descriptionUk?: string;
        priceCents: number;
        imageBase64?: string;
        stock?: number;
        isActive?: boolean;
    }) {
        return this.request<Product>('/api/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProduct(id: string, data: {
        nameEn?: string;
        nameUk?: string;
        descriptionEn?: string;
        descriptionUk?: string;
        priceCents?: number;
        imageBase64?: string;
        stock?: number;
        isActive?: boolean;
    }) {
        return this.request<Product>(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(id: string) {
        return this.request<void>(`/api/products/${id}`, {
            method: 'DELETE',
        });
    }

    async getAllOrders(page?: number, limit?: number, lang?: string) {
        const params = new URLSearchParams();
        if (lang) params.append('lang', lang);
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        const queryString = params.toString();
        const url = `/api/orders${queryString ? `?${queryString}` : ''}`;
        const result = await this.request<{ 
            data: Array<{
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
            }>;
            pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(url);
        if (!result) {
            throw new Error('Invalid response from server');
        }
        return result;
    }

    async updateOrderStatus(id: string, status: 'created' | 'paid' | 'cancelled') {
        return this.request<{
            id: string;
            status: 'created' | 'paid' | 'cancelled';
            totalCents: number;
            createdAt: string;
            updatedAt: string;
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
        }>(`/api/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async getStatistics() {
        return this.request<{
            totalOrders: number;
            totalProducts: number;
            totalUsers: number;
            totalRevenue: number;
        }>('/api/statistics');
    }
}

export interface Product {
    id: string;
    name: string; // Transformed based on language
    description?: string | null; // Transformed based on language
    nameEn?: string; // Full multilingual data (for admin)
    nameUk?: string;
    descriptionEn?: string | null;
    descriptionUk?: string | null;
    priceCents: number;
    imageBase64?: string | null;
    stock: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const apiClient = new ApiClient();

