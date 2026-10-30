export const instant = false;
import Link from "next/link";

type PaymentSuccessPageProps = {
    params: Promise<{
        "order-id": string;
    }>;
};

export default async function PaymentSuccessPage({
    params,
}: PaymentSuccessPageProps) {
    const { "order-id": orderId } = await params;

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
                    ✓
                </div>

                <h1 className="mt-6 text-2xl font-bold text-gray-900">
                    Payment Successful..
                </h1>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                    Thank you for shopping with Alpha Male. Your order has been
                    placed successfully.
                </p>

                <div className="mt-5 break-all rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    Order ID: <span className="font-semibold">{orderId}</span>
                </div>

                <div className="mt-7 flex flex-col gap-3">
                    <Link
                        href={`/orders`}
                        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                    >
                        View Order
                    </Link>

                    <Link
                        href="/"
                        className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </main>
    );
}