// Copia texto al portapapeles. navigator.clipboard solo existe en HTTPS o localhost,
// así que se prueba un método alterno antes de rendirse.
export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    /* se intenta el método alterno */
  }
  try {
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    const copiado = document.execCommand('copy');
    campo.remove();
    return copiado;
  } catch {
    return false;
  }
}
