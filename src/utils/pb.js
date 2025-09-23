const baseUrl = import.meta.env.PB_URL;
const adminToken = import.meta.env.PB_ADMIN_TOKEN;

class CollectionClient {
    constructor(baseUrl, collection, token) {
        this.baseUrl = baseUrl;
        this.collection = collection;
        this.token = token;
    }

    async request(path, options = {}) {
        if (!this.baseUrl) {
            throw new Error("PocketBase URL missing (PB_URL)");
        }

        const url = `${this.baseUrl}/api/collections/${this.collection}${path}`;
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        };

        if (this.token) {
            headers.Authorization = this.token;
        }

        const res = await fetch(url, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `PocketBase request failed with ${res.status}`);
        }

        try {
            return await res.json();
        } catch (error) {
            throw new Error("Invalid JSON response from PocketBase");
        }
    }

    create(data) {
        return this.request("/records", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    update(id, data) {
        if (!id) {
            throw new Error("Missing record id for update");
        }
        return this.request(`/records/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }

    getOne(id, params = {}) {
        if (!id) {
            throw new Error("Missing record id for getOne");
        }
        const searchParams = new URLSearchParams(params).toString();
        const query = searchParams ? `?${searchParams}` : "";
        return this.request(`/records/${id}${query}`, {
            method: "GET",
        });
    }

    async getFullList(params = {}) {
        const defaultParams = { perPage: "200" };
        const searchParams = new URLSearchParams({ ...defaultParams, ...params }).toString();
        const query = searchParams ? `?${searchParams}` : "";
        const result = await this.request(`/records${query}`, {
            method: "GET",
        });

        if (Array.isArray(result?.items)) {
            return result.items;
        }

        if (Array.isArray(result)) {
            return result;
        }

        return [];
    }
}

class PocketBaseClient {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    collection(collection) {
        return new CollectionClient(this.baseUrl, collection, this.token);
    }
}

const pb = new PocketBaseClient(baseUrl, adminToken);

export default pb;
