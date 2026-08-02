import React, { useEffect, useState, useMemo } from 'react';
import { RankingItem } from '../types/index.js';
import { formatNumber, formatPercent } from '../utils/formatters.js';
import { MapPin, Info } from 'lucide-react';

interface AlagoasMapProps {
  data: RankingItem[];
  variavel: string;
  etapa?: string;
  loading: boolean;
}

export const AlagoasMap: React.FC<AlagoasMapProps> = ({ data, variavel, etapa, loading }) => {
  const [geoJson, setGeoJson] = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [hoveredMun, setHoveredMun] = useState<{ no_mun: string; co_mun: string; valor: number | null } | null>(null);

  const isRate = variavel.startsWith('Taxa');
  const isEscolasSemEtapa = variavel === 'Escolas' && (!etapa || etapa === 'Todas' || etapa === 'Todos');

  // Fetch GeoJSON from local static file (0ms) with IBGE Mesh API fallback
  useEffect(() => {
    let isMounted = true;
    async function loadGeoJson() {
      try {
        let response = await fetch('/alagoas-municipios.json');
        if (!response.ok) {
          response = await fetch(
            'https://servicodados.ibge.gov.br/api/v3/malhas/estados/27?formato=application/vnd.geo+json&intrarregiao=municipio&resolucao=2'
          );
        }
        if (!response.ok) throw new Error('Falha ao carregar malha geográfica');
        const json = await response.json();
        if (isMounted) {
          setGeoJson(json);
          setFetchError(false);
        }
      } catch (err) {
        console.warn('GeoJSON IBGE indisponível. Ativando visualização vetorial fallback.', err);
        if (isMounted) setFetchError(true);
      }
    }
    loadGeoJson();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map values by 7-digit IBGE co_mun (primary key) and 6-digit prefix (fallback)
  const dataMap = useMemo(() => {
    const map = new Map<string, { valor: number; no_mun: string; co_mun: string }>();
    for (const item of data) {
      const rawCode = String(item.co_mun).trim();
      const code6 = rawCode.slice(0, 6);
      const valObj = { valor: item.valor, no_mun: item.no_mun, co_mun: rawCode };

      map.set(rawCode, valObj);
      if (code6 && code6.length === 6) map.set(code6, valObj);
    }
    return map;
  }, [data]);

  // Determine min & max for color scale over valid numeric values
  const { minVal, maxVal, hasData } = useMemo(() => {
    const vals = data
      .map((d) => d.valor)
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

    if (vals.length === 0) return { minVal: 0, maxVal: 0, hasData: false };
    return { minVal: Math.min(...vals), maxVal: Math.max(...vals), hasData: true };
  }, [data]);

  function getColor(val: number | null | undefined): string {
    if (val === null || val === undefined) return '#94A3B8';
    if (maxVal === minVal) return '#0F5237';

    const ratio = (val - minVal) / (maxVal - minVal);
    if (ratio < 0.2) return '#ECF7F0';
    if (ratio < 0.4) return '#A7F3D0';
    if (ratio < 0.6) return '#34D399';
    if (ratio < 0.8) return '#059669';
    return '#0F5237';
  }

  // Calculate bounding box for auto-fitting SVG projection
  const bbox = useMemo(() => {
    if (!geoJson?.features || geoJson.features.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    geoJson.features.forEach((f: any) => {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      polys.forEach((poly: any) => {
        poly.forEach((ring: any) => {
          ring.forEach((pt: any) => {
            if (pt[0] < minX) minX = pt[0];
            if (pt[0] > maxX) maxX = pt[0];
            if (pt[1] < minY) minY = pt[1];
            if (pt[1] > maxY) maxY = pt[1];
          });
        });
      });
    });
    return { minX, maxX, minY, maxY };
  }, [geoJson]);

  // Project longitude/latitude to SVG canvas coordinates (800x500)
  const projectPoint = useMemo(() => {
    if (!bbox) return (_lng: number, _lat: number) => '0,0';
    const width = bbox.maxX - bbox.minX || 1;
    const height = bbox.maxY - bbox.minY || 1;
    const padding = 20;
    const svgW = 800 - padding * 2;
    const svgH = 500 - padding * 2;
    const scale = Math.min(svgW / width, svgH / height);

    return (lng: number, lat: number) => {
      const x = padding + (lng - bbox.minX) * scale;
      const y = padding + (bbox.maxY - lat) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
  }, [bbox]);

  // Convert feature geometry to SVG path D string
  const featureToPathD = useMemo(() => {
    return (f: any) => {
      if (!f.geometry?.coordinates) return '';
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      return polys
        .map((poly: any) =>
          poly
            .map((ring: any) => 'M ' + ring.map((pt: any) => projectPoint(pt[0], pt[1])).join(' L ') + ' Z')
            .join(' ')
        )
        .join(' ');
    };
  }, [projectPoint]);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-[#E2E8F0] pb-3.5">
        <div>
          <h3 className="text-lg font-semibold text-[#0F5237] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0F5237]" />
            Mapa Coroplético de Alagoas ({variavel})
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Distribuição geográfica por município via Malha IBGE (Join por Código IBGE de 7 dígitos)
          </p>
          {isEscolasSemEtapa && (
            <p className="text-[11px] text-[#92400E] font-medium mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-[#B45309]" />
              <span>Valores somados por etapa representam ofertas de ensino, não escolas únicas</span>
            </p>
          )}
        </div>

        {hoveredMun && (
          <div className="px-3 py-1.5 bg-[#F8FAF9] border border-[#CBD5E1] rounded-xl text-xs flex items-center gap-2 shadow-xs">
            <span className="font-semibold text-[#0F172A]">{hoveredMun.no_mun}:</span>
            <span className="font-bold text-[#0F5237]">
              {hoveredMun.valor !== null && hoveredMun.valor !== undefined
                ? isRate
                  ? formatPercent(hoveredMun.valor)
                  : formatNumber(hoveredMun.valor)
                : 'Sem dado no filtro'}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-96 bg-[#F8FAF9] rounded-xl animate-pulse flex items-center justify-center text-[#64748B] text-sm font-medium">
          Carregando malha geográfica...
        </div>
      ) : geoJson && geoJson.features && !fetchError ? (
        <div className="relative h-96 w-full bg-[#F8FAF9] rounded-xl overflow-hidden border border-[#E2E8F0] p-2">
          <svg viewBox="0 0 800 500" className="w-full h-full">
            <g>
              {geoJson.features.map((feature: any, idx: number) => {
                const featureCoMun = String(feature.properties?.codarea || '').trim();
                const featureCoMun6 = featureCoMun.slice(0, 6);

                const matched =
                  (featureCoMun ? dataMap.get(featureCoMun) : undefined) ||
                  (featureCoMun6.length === 6 ? dataMap.get(featureCoMun6) : undefined);

                const valor = matched ? matched.valor : null;
                const name = matched ? matched.no_mun : `Município ${featureCoMun || idx}`;
                const fillColor = getColor(valor);
                const pathD = featureToPathD(feature);

                return (
                  <path
                    key={idx}
                    d={pathD}
                    fill={fillColor}
                    stroke="#F8FAF9"
                    strokeWidth="0.9"
                    className="transition-all duration-150 cursor-pointer hover:stroke-[#0F5237] hover:stroke-[2px] hover:brightness-110"
                    onMouseEnter={() => setHoveredMun({ no_mun: name, co_mun: featureCoMun, valor })}
                    onMouseLeave={() => setHoveredMun(null)}
                  >
                    <title>{`${name}: ${valor !== null && valor !== undefined ? (isRate ? formatPercent(valor) : formatNumber(valor)) : 'Sem dado no filtro'}`}</title>
                  </path>
                );
              })}
            </g>
          </svg>

          {/* Map Legend */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur border border-[#CBD5E1] p-3 rounded-xl text-[11px] text-[#475569] shadow-md space-y-1">
            <div className="font-semibold text-[#0F172A] mb-1">Escala de Cores</div>
            {hasData && (
              maxVal === minVal ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#0F5237' }}></span>
                  <span className="font-medium text-[#1E293B]">Valor ({isRate ? formatPercent(minVal) : formatNumber(minVal)})</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded border border-slate-300" style={{ backgroundColor: '#ECF7F0' }}></span>
                    <span className="font-medium text-[#1E293B]">Mínimo ({isRate ? formatPercent(minVal) : formatNumber(minVal)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#34D399' }}></span>
                    <span className="font-medium text-[#1E293B]">Médio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#0F5237' }}></span>
                    <span className="font-medium text-[#1E293B]">Máximo ({isRate ? formatPercent(maxVal) : formatNumber(maxVal)})</span>
                  </div>
                </>
              )
            )}
            <div className="flex items-center gap-1.5 pt-1 border-t border-[#E2E8F0]">
              <span className="w-3 h-3 rounded bg-[#94A3B8]"></span>
              <span className="text-[#475569] font-medium">Sem dado no filtro</span>
            </div>
          </div>
        </div>
      ) : (
        /* Fail-safe Fallback list grid */
        <div className="h-80 overflow-y-auto p-4 bg-[#F8FAF9] rounded-xl border border-[#E2E8F0]">
          <div className="text-xs text-[#92400E] mb-3 flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-[#B45309]" />
            <span>Exibição de distribuição (Rede/API IBGE com degradação graciosa):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.map((item) => (
              <div key={item.co_mun} className="p-2.5 bg-white rounded-lg border border-[#E2E8F0] text-xs">
                <div className="font-semibold text-[#0F172A] truncate">{item.no_mun}</div>
                <div className="text-[#0F5237] font-bold mt-0.5">
                  {isRate ? formatPercent(item.valor) : formatNumber(item.valor)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
