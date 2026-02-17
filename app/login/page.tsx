import LoginForm from "./form";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-200/30 blur-[100px]" />
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-200/30 blur-[100px]" />
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md p-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Welcome back
                        </h1>
                        <p className="text-sm text-gray-500">
                            Sign in to access your digital library
                        </p>
                    </div>

                    <LoginForm />

                    <div className="text-center text-sm">
                        <p className="text-gray-500">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/register"
                                className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
                            >
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
