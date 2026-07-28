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

  // Fetch GeoJSON from IBGE Mesh API for Alagoas (UF 27) with clean degradation
  useEffect(() => {
    let isMounted = true;
    async function loadGeoJson() {
      try {
        const response = await fetch(
          'https://servicodados.ibge.gov.br/api/v3/malhas/estados/27?formato=application/vnd.geo+json&intrarregiao=municipio&resolucao=2'
        );
        if (!response.ok) throw new Error('Falha na API IBGE');
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

  // Helper to normalize municipality names for resilient matching
  const normalizeName = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Map values by 7-digit IBGE co_mun, 6-digit prefix, and normalized name
  const dataMap = useMemo(() => {
    const map = new Map<string, { valor: number; no_mun: string; co_mun: string }>();
    for (const item of data) {
      const rawCode = String(item.co_mun).trim();
      const code6 = rawCode.slice(0, 6);
      const normName = normalizeName(item.no_mun);
      const valObj = { valor: item.valor, no_mun: item.no_mun, co_mun: item.co_mun };

      map.set(rawCode, valObj);
      if (code6) map.set(code6, valObj);
      if (normName) map.set(normName, valObj);
    }
    return map;
  }, [data]);

  // Determine min & max for color scale
  const { minVal, maxVal } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 100 };
    const vals = data.map((d) => d.valor);
    return { minVal: Math.min(...vals), maxVal: Math.max(...vals) };
  }, [data]);

  function getColor(val: number | null | undefined): string {
    if (val === null || val === undefined) return '#334155'; // Slate-700 for no data in filter
    if (maxVal === minVal) return '#0284c7';

    const ratio = (val - minVal) / (maxVal - minVal);
    if (ratio < 0.2) return '#e0f2fe';
    if (ratio < 0.4) return '#7dd3fc';
    if (ratio < 0.6) return '#38bdf8';
    if (ratio < 0.8) return '#0284c7';
    return '#075985';
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
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-slate-700/60 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            Mapa Coroplético de Alagoas ({variavel})
          </h3>
          <p className="text-xs text-slate-400">
            Distribuição geográfica por município via Malha IBGE (Join por Código IBGE de 7 dígitos)
          </p>
          {isEscolasSemEtapa && (
            <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Valores somados por etapa representam ofertas de ensino, não escolas únicas</span>
            </p>
          )}
        </div>

        {hoveredMun && (
          <div className="px-3 py-1.5 bg-slate-900 border border-sky-500/30 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <span className="font-semibold text-white">{hoveredMun.no_mun}:</span>
            <span className="font-bold text-sky-400">
              {hoveredMun.valor !== null
                ? isRate
                  ? formatPercent(hoveredMun.valor)
                  : formatNumber(hoveredMun.valor)
                : 'Sem dado'}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-80 bg-slate-900/50 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-sm">
          Carregando malha geográfica...
        </div>
      ) : geoJson && geoJson.features && !fetchError ? (
        <div className="relative h-96 w-full bg-slate-950/90 rounded-xl overflow-hidden border border-slate-700/50 p-2">
          <svg viewBox="0 0 800 500" className="w-full h-full">
            <g>
              {geoJson.features.map((feature: any, idx: number) => {
                const featureCoMun = String(feature.properties?.codarea || feature.properties?.CD_MUN || feature.id || '').trim();
                const featureCoMun6 = featureCoMun.slice(0, 6);
                const featureName = String(feature.properties?.name || '').trim();
                const featureNormName = featureName ? normalizeName(featureName) : '';

                const matched =
                  dataMap.get(featureCoMun) ||
                  dataMap.get(featureCoMun6) ||
                  (featureNormName ? dataMap.get(featureNormName) : undefined);

                const valor = matched ? matched.valor : null;
                const name = matched ? matched.no_mun : featureName || 'Município';
                const fillColor = getColor(valor);
                const pathD = featureToPathD(feature);

                return (
                  <path
                    key={idx}
                    d={pathD}
                    fill={fillColor}
                    stroke="#0f172a"
                    strokeWidth="0.8"
                    className="transition-all duration-150 cursor-pointer hover:stroke-sky-300 hover:stroke-[2px] hover:brightness-125"
                    onMouseEnter={() => setHoveredMun({ no_mun: name, co_mun: featureCoMun, valor })}
                    onMouseLeave={() => setHoveredMun(null)}
                  >
                    <title>{`${name}: ${valor !== null ? (isRate ? formatPercent(valor) : formatNumber(valor)) : 'Sem dado'}`}</title>
                  </path>
                );
              })}
            </g>
          </svg>

          {/* Map Legend */}
          <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl text-[11px] text-slate-300 shadow-xl space-y-1 backdrop-blur">
            <div className="font-semibold text-slate-200 mb-1">Escala de Cores</div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#e0f2fe' }}></span>
              <span>Mínimo ({isRate ? `${minVal.toFixed(1)}%` : formatNumber(minVal)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#0284c7' }}></span>
              <span>Médio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: '#075985' }}></span>
              <span>Máximo ({isRate ? `${maxVal.toFixed(1)}%` : formatNumber(maxVal)})</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
              <span className="w-3 h-3 rounded bg-slate-700"></span>
              <span className="text-slate-400">Sem dado no filtro</span>
            </div>
          </div>
        </div>
      ) : (
        /* Fail-safe Fallback list grid */
        <div className="h-80 overflow-y-auto p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
          <div className="text-xs text-amber-400 mb-3 flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            <span>Exibição de distribuição (Rede/API IBGE com degradação graciosa):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.map((item) => (
              <div key={item.co_mun} className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/40 text-xs">
                <div className="font-semibold text-slate-200 truncate">{item.no_mun}</div>
                <div className="text-sky-400 font-mono mt-0.5">
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
