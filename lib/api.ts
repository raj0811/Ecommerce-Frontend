const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiError = {
    message?: string | string[];
};

export type User = {
    id: string;
    name: string;
    email: string;
    number: string;
};

export type LoginResponse = {
    message: string;
    accessToken: string;
    user: User;
};

export type RegisterResponse = {
    message: string;
    user: User;
};

async function request<T>(
    endpoint: string,
    body: Record<string, string>,
): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorData = data as ApiError;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message;

        throw new Error(message || "Something went wrong. Please try again.");
    }

    return data as T;
}

export function loginUser(email: string, password: string) {
    return request<LoginResponse>("/user/login", { email, password });
}

export function registerUser(input: {
    name: string;
    email: string;
    password: string;
    number: string;
}) {
    return request<RegisterResponse>("/user/register", input);
}