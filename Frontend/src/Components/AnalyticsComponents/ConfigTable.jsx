import { CONFIG_FIELDS, sameValue } from "./analyticsFormat";

// Tabla con los campos de la config de la corrida. Si hay una corrida anterior
// del mismo modelo e intervalo, resalta en amarillo lo que cambió y muestra el
// valor anterior. Solo muestra los campos que existen en esta corrida o en la
// anterior (un long no tiene rsi_min_filter ni un short rsi_max_filter).
const ConfigTable = ({ config, previous, model }) => {
  const prevConfig = previous?.config;
  const fields = CONFIG_FIELDS.filter(
    ({ key }) => config?.[key] !== undefined || prevConfig?.[key] !== undefined
  );

  return (
    <section aria-labelledby="config-title">
      <div className="flex items-center justify-between mb-2">
        <h3 id="config-title" className="text-[11px] tracking-wider text-[#848e9c] uppercase">
          Configuración
        </h3>
        {prevConfig && (
          <span className="text-[10px] text-[#f0b90b]">■ cambió vs #{previous.id}</span>
        )}
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
        {fields.map(({ key, label, detail }) => {
          const value = config?.[key];
          const changed = prevConfig && !sameValue(value, prevConfig[key]);
          return (
            <div
              key={key}
              className={`rounded-md px-3 py-2 border ${
                changed ? "bg-[#2b2a18] border-[#f0b90b]" : "bg-[#1e2026] border-transparent"
              }`}
            >
              <dt className="text-[11px] text-[#848e9c]">{label}</dt>
              <dd className={`text-xs font-semibold break-words ${changed ? "text-[#f0b90b]" : "text-[#eaecef]"}`}>
                {value === undefined ? "—" : detail(value, config, model)}
              </dd>
              {changed && (
                <dd className="text-[10px] text-[#848e9c] break-words">
                  era {prevConfig[key] === undefined ? "—" : detail(prevConfig[key], prevConfig, model)}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
};

export default ConfigTable;
