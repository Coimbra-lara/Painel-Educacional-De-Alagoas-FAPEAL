import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { parseAndInsertCsvStream } from '../src/services/csvStreamParser.js';
import { getFiltros, getIndicadores, getTabelaDados } from '../src/repository/medidasRepository.js';
import { prisma } from '../src/services/db.js';

describe('Seção 10: Testes de Validação Obrigatória de Dados Educacionais', () => {
  const sampleCsvPath = path.join(__dirname, '../../data/sample_alagoas_3534.csv');

  beforeAll(async () => {
    // Import sample CSV before running test assertions
    const fileStream = fs.createReadStream(sampleCsvPath);
    const report = await parseAndInsertCsvStream(fileStream, true);
    expect(report.linhasImportadas).toBe(3534);
  });

  it('1. Total de linhas do arquivo (fora cabeçalho) deve ser exatamente 3.534', async () => {
    const totalCount = await prisma.medida.count();
    expect(totalCount).toBe(3534);
  });

  it('2. Deve conter exatamente 10 municípios distintos', async () => {
    const { municipios } = await getFiltros();
    expect(municipios.length).toBe(10);
  });

  it('3. Anos distintos devem ser exatamente [2010, 2019, 2021, 2022, 2023]', async () => {
    const { anos } = await getFiltros();
    expect(anos).toEqual([2010, 2019, 2021, 2022, 2023]);
  });

  it('4. Matrículas 2023, rede Total, 5 etapas, 10 municípios deve ser exatamente 380.454', async () => {
    const sumMatr = await prisma.medida.aggregate({
      where: {
        ano: 2023,
        variavel: 'Matrícula',
        ensino_rede: 'Total',
      },
      _sum: { valor: true },
    });
    expect(sumMatr._sum.valor).toBe(380454);
  });

  it('5. Maceió 2023, Matrícula, Ensino Fundamental, Total deve ser exatamente 109.026', async () => {
    const maceioEF = await prisma.medida.findFirst({
      where: {
        co_mun: '2704302',
        ano: 2023,
        variavel: 'Matrícula',
        ensino_tipo: 'Ensino Fundamental',
        ensino_rede: 'Total',
      },
    });
    expect(maceioEF).not.toBeNull();
    expect(maceioEF?.valor).toBe(109026);
  });

  it('6. Taxa de Aprovação, Ens. Fundamental, 2023, Total (ponderada) deve ser 96,16%', async () => {
    const indicadores = await getIndicadores({
      anoInicio: 2023,
      anoFim: 2023,
      etapa: 'Ensino Fundamental',
      rede: 'Total',
    });
    expect(indicadores.taxaAprovacaoPonderada).not.toBeNull();
    expect(indicadores.taxaAprovacaoPonderada!.toFixed(2)).toBe('96.16');
  });

  it('7. Taxa de Analfabetismo, Maceió deve ser 11,86% (2010) e 8,42% (2022)', async () => {
    const maceio2010 = await prisma.medida.findFirst({
      where: {
        co_mun: '2704302',
        ano: 2010,
        variavel: 'Taxa de Analfabetismo',
      },
    });
    const maceio2022 = await prisma.medida.findFirst({
      where: {
        co_mun: '2704302',
        ano: 2022,
        variavel: 'Taxa de Analfabetismo',
      },
    });

    expect(maceio2010?.valor).toBe(11.86);
    expect(maceio2022?.valor).toBe(8.42);
  });

  it('8. Taxa de Analfabetismo, Piaçabuçu deve ser 31,77% (2010) e 22,83% (2022)', async () => {
    const piacabucu2010 = await prisma.medida.findFirst({
      where: {
        co_mun: '2706802',
        ano: 2010,
        variavel: 'Taxa de Analfabetismo',
      },
    });
    const piacabucu2022 = await prisma.medida.findFirst({
      where: {
        co_mun: '2706802',
        ano: 2022,
        variavel: 'Taxa de Analfabetismo',
      },
    });

    expect(piacabucu2010?.valor).toBe(31.77);
    expect(piacabucu2022?.valor).toBe(22.83);
  });

  it('Deve rejeitar arquivos CSV com cabeçalho inválido', async () => {
    const invalidHeaderCsv = Readable.from(['coluna1,coluna2,coluna3\n1,2,3']);
    await expect(parseAndInsertCsvStream(invalidHeaderCsv, false)).rejects.toThrow('Cabeçalho CSV inválido');
  });

  it('9. getMapaData/getRanking deve retornar o valor exato do ano filtrado (2022: Maceió 8.42%, Piaçabuçu 22.83%)', async () => {
    const { getMapaData } = await import('../src/repository/medidasRepository.js');
    const mapa2022 = await getMapaData({
      variavel: 'Taxa de Analfabetismo',
      anoInicio: 2022,
    });

    const maceio = mapa2022.find((m) => m.no_mun === 'Maceió');
    const piacabucu = mapa2022.find((m) => m.no_mun === 'Piaçabuçu');

    expect(maceio?.valor).toBe(8.42);
    expect(piacabucu?.valor).toBe(22.83);
  });

  it('10. getDistribuicao por rede deve retornar apenas redes granulares sem sobreposição', async () => {
    const { getDistribuicao } = await import('../src/repository/medidasRepository.js');
    const distRede = await getDistribuicao({
      variavel: 'Matrícula',
      anoInicio: 2023,
      visao: 'rede',
    });

    const categorias = distRede.map((d) => d.categoria);
    expect(categorias).toContain('Estadual');
    expect(categorias).toContain('Municipal');
    expect(categorias).not.toContain('Total');
    expect(categorias).not.toContain('Pública');
  });
});
