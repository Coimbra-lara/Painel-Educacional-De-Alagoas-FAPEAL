/**
 * Variáveis que pertencem ao censo_demografico.
 * No CSV, essas variáveis sempre aparecem com:
 *   ensino_rede = "Não se aplica"
 *   ensino_tipo = "Pessoas de 15 anos ou mais de idade"
 * Não possuem relação com rede/etapa de ensino escolar.
 */
export const VARIAVEIS_CENSO_DEMOGRAFICO = [
  'Taxa de Analfabetismo',
  'Taxa de Alfabetização',
  'Pessoas Total',
  'Pessoas Alfabetizadas',
] as const;

export const REDE_CENSO_DEMOGRAFICO = 'Não se aplica';
export const ETAPA_CENSO_DEMOGRAFICO = 'Pessoas de 15 anos ou mais de idade';

export function ehVariavelCensoDemografico(variavel: string): boolean {
  return (VARIAVEIS_CENSO_DEMOGRAFICO as readonly string[]).includes(variavel);
}
