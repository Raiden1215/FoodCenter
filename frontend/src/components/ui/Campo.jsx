export default function Campo({ label, id, icono: Icono, ...props }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {Icono && <Icono size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />}
      <input
        id={id}
        placeholder={label}
        className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pr-4 text-base outline-none placeholder:text-gray-400 focus:border-brand-500 focus:bg-white ${
          Icono ? 'pl-12' : 'pl-4'
        }`}
        {...props}
      />
    </div>
  );
}
