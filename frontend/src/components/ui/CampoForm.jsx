// Campos de formulario con etiqueta visible (para formularios largos, a diferencia de <Campo> del login).
const claseBase =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none placeholder:text-gray-400 focus:border-brand-500 focus:bg-white';

function Etiqueta({ id, label, ayuda, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {ayuda && <p className="mt-1 text-xs text-gray-500">{ayuda}</p>}
    </div>
  );
}

export function CampoForm({ id, label, ayuda, ...props }) {
  return (
    <Etiqueta id={id} label={label} ayuda={ayuda}>
      <input id={id} className={claseBase} {...props} />
    </Etiqueta>
  );
}

export function AreaForm({ id, label, ayuda, ...props }) {
  return (
    <Etiqueta id={id} label={label} ayuda={ayuda}>
      <textarea id={id} rows={4} className={claseBase} {...props} />
    </Etiqueta>
  );
}

export function SelectorForm({ id, label, ayuda, opciones, placeholder, ...props }) {
  return (
    <Etiqueta id={id} label={label} ayuda={ayuda}>
      <select id={id} className={claseBase} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </Etiqueta>
  );
}

export function Seccion({ titulo, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-brand-100 bg-white p-4">
      <h2 className="font-semibold text-gray-800">{titulo}</h2>
      {children}
    </section>
  );
}
