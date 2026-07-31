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

  describe('Validação dos 5 Cenários Obrigatórios de Upload CSV', () => {
    it('CASO 1: CSV correto completo — aceita e importa todas as linhas válidas', async () => {
      const fileStream = fs.createReadStream(sampleCsvPath);
      const report = await parseAndInsertCsvStream(fileStream, true);
      expect(report.linhasLidas).toBe(3534);
      expect(report.linhasImportadas).toBe(3534);
      expect(report.linhasRejeitadas).toBe(0);
    });

    it('CASO 2: CSV com coluna obrigatória renomeada — rejeita e não insere linhas parciais', async () => {
      const invalidHeaderCsv = Readable.from(['codigo_ibge,no_mun,ano,fonte,variavel,ensino_rede,ensino_tipo,valor\n2704302,Maceió,2023,MEC,Matrícula,Total,Ensino Fundamental,100']);
      await expect(parseAndInsertCsvStream(invalidHeaderCsv, false)).rejects.toThrow('Cabeçalho CSV inválido');
    });

    it('CASO 3: CSV com cabeçalho correto e ZERO linhas — processa com 0 linhas importadas sem quebrar', async () => {
      const emptyHeaderCsv = Readable.from(['co_mun,no_mun,ano,fonte,variavel,ensino_rede,ensino_tipo,valor\n']);
      const report = await parseAndInsertCsvStream(emptyHeaderCsv, false);
      expect(report.linhasLidas).toBe(0);
      expect(report.linhasImportadas).toBe(0);
      expect(report.linhasRejeitadas).toBe(0);
    });

    it('CASO 4: Conteúdo de texto plano inválido (.txt renomeado para .csv) — rejeita com erro', async () => {
      const txtContent = Readable.from(['Este é um texto qualquer sem formato csv educacional válido\nLinha 2 de texto']);
      await expect(parseAndInsertCsvStream(txtContent, false)).rejects.toThrow();
    });

    it('CASO 5: Reimportação (mesmo CSV enviado 2x) — substitui dados anteriores evitando duplicação', async () => {
      const fileStream1 = fs.createReadStream(sampleCsvPath);
      await parseAndInsertCsvStream(fileStream1, true);
      const count1 = await prisma.medida.count();

      const fileStream2 = fs.createReadStream(sampleCsvPath);
      await parseAndInsertCsvStream(fileStream2, true);
      const count2 = await prisma.medida.count();

      expect(count1).toBe(3534);
      expect(count2).toBe(3534); // Não duplicou para 7068
    });
  });

  describe('Diferenciação Estrita entre Valor ZERO e AUSÊNCIA DE DADOS', () => {
    it('CASO A: Registro existente com valor = 0 deve retornar exatamente 0', async () => {
      // Inserir medida temporária com valor 0
      await prisma.medida.create({
        data: {
          co_mun: '9999999',
          no_mun: 'Município Teste Zero',
          ano: 2023,
          fonte: 'TESTE',
          variavel: 'Matrícula',
          ensino_rede: 'Total',
          ensino_tipo: 'Ensino Fundamental',
          valor: 0,
        },
      });

      const item = await prisma.medida.findFirst({
        where: { co_mun: '9999999', ano: 2023 },
      });

      expect(item).not.toBeNull();
      expect(item?.valor).toBe(0);

      // Limpar registro temporário
      await prisma.medida.deleteMany({ where: { co_mun: '9999999' } });
    });

    it('CASO B: Combinação inexistente deve retornar NULL (ausência de dados)', async () => {
      const item = await prisma.medida.findFirst({
        where: { co_mun: '0000000', ano: 1900 },
      });
      expect(item).toBeNull();
    });
  });

  describe('Validação Estrita do Intervalo de Anos (anoInicio <= anoFim)', () => {
    it('Intervalo invertido (anoInicio = 2023 > anoFim = 2019) deve ser rejeitado com HTTP 400', async () => {
      const { app } = await import('../src/app.js');
      const supertest = (await import('supertest')).default;
      const response = await supertest(app).get('/api/indicadores?anoInicio=2023&anoFim=2019');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('O ano inicial deve ser menor ou igual ao ano final.');
    });
  });
});
