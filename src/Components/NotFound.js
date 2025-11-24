export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg w-full space-y-8 text-center">
                {/* Animated 404 */}
                <div className="relative">
                    <div className="text-9xl font-bold text-gray-300 dark:text-gray-600 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                            404
                        </div>
                    </div>
                </div>

                {/* Floating elements */}
                <div className="relative">
                    {/* Floating circles */}
                    <div className="absolute -top-8 -left-8 w-16 h-16 bg-blue-200 dark:bg-blue-800 rounded-full opacity-50 animate-bounce"></div>
                    <div className="absolute -bottom-4 -right-6 w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-4 -right-10 w-8 h-8 bg-pink-200 dark:bg-pink-800 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '2s' }}></div>

                    {/* Main content */}
                    <div className="relative z-10">
                        <div className="mb-6">
                            <svg className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Page Not Found
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                                Oops! The page you're looking for seems to have wandered off into the digital void.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Go Home
                            </a>
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional info */}
                <div className="pt-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        If you believe this is an error, please contact support.
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute bottom-10 left-10 w-20 h-20 bg-yellow-200 dark:bg-yellow-800 rounded-full opacity-30 blur-xl"></div>
                <div className="absolute top-10 right-10 w-24 h-24 bg-green-200 dark:bg-green-800 rounded-full opacity-30 blur-xl"></div>
            </div>
        </div>
    );
}