// Funciones puras de cálculo para el panel de futuros.
//
// Sin JSX ni I/O: se extraen del componente TradingPanel.jsx para poder
// reutilizarlas (tarea 16) y testearlas de forma aislada (fast-check).
//
// Feature: futures-trading-panel
// Requirements: 4.3, 10.1, 10.2

/**
 * Convierte un valor arbitrario a número finito no negativo de forma segura.
 * Devuelve 0 para entradas no numéricas, NaN o Infinity.
 *
 * @param {*} value
 * @returns {number}
 */
const toSafeNumber = (value) => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return n;
};

/**
 * Restringe un número al rango [min, max].
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Calcula el monto en USDT a partir de un porcentaje del slider y el saldo
 * disponible: `(percent / 100) * availableBalance`.
 *
 * Maneja entradas no numéricas devolviendo 0 de forma segura y limita
 * `percent` al rango [0, 100].
 *
 * Requirements: 4.3
 *
 * @param {number} percent - Porcentaje del slider (0..100).
 * @param {number} availableBalance - Saldo USDT disponible.
 * @returns {number} Monto en USDT.
 */
export const computeAmountFromSlider = (percent, availableBalance) => {
  const safePercent = clamp(toSafeNumber(percent), 0, 100);
  const safeBalance = toSafeNumber(availableBalance);
  return (safePercent / 100) * safeBalance;
};

/**
 * Calcula los estimados previos a la apertura de una posición.
 *
 * - `cost`: margen requerido en USDT, igual a `amountUsdt` (Req 10.1).
 * - `maxNotional`: notional máximo abrible estimado, igual a
 *   `availableBalance * leverage` (Req 10.2).
 *
 * Se incluyen campos redondeados adicionales (`costRounded`,
 * `maxNotionalRounded`) útiles para mostrar en el panel; `cost` y
 * `maxNotional` se mantienen exactos según la fórmula.
 *
 * Maneja entradas no numéricas de forma segura; `leverage` se limita a un
 * mínimo de 1.
 *
 * Requirements: 10.1, 10.2
 *
 * @param {number} amountUsdt - Monto de margen destinado a la orden (USDT).
 * @param {number} availableBalance - Saldo USDT disponible.
 * @param {number} leverage - Apalancamiento seleccionado (>= 1).
 * @returns {{ cost: number, maxNotional: number, costRounded: number, maxNotionalRounded: number }}
 */
export const computeEstimates = (amountUsdt, availableBalance, leverage) => {
  const safeAmount = toSafeNumber(amountUsdt);
  const safeBalance = toSafeNumber(availableBalance);
  const safeLeverage = Math.max(toSafeNumber(leverage), 1);

  const cost = safeAmount;
  const maxNotional = safeBalance * safeLeverage;

  const round2 = (v) => Math.round(v * 100) / 100;

  return {
    cost,
    maxNotional,
    costRounded: round2(cost),
    maxNotionalRounded: round2(maxNotional),
  };
};
