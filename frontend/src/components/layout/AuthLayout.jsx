export default function AuthLayout({ titulo, children }) {
  return (
    <div
      className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-8"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <p className="text-3xl font-bold text-brand-600">FoodCenter</p>
      <h1 className="mt-1 mb-8 text-lg font-semibold text-gray-800">{titulo}</h1>
      {children}
    </div>
  );
}
