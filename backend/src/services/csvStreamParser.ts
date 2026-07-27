import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { z } from 'zod';
import { prisma } from './db';

export const MedidaRowSchema = z.object({
  co_mun: z.string().trim().min(1, "Código IBGE do município é obrigatório"),
  no_mun: z.string().trim().min(1, "Nome do município é obrigatório"),
  ano: z.number({ invalid_type_error: "Ano deve ser numérico" }).int().min(2007, "Ano fora da faixa 2007-2025").max(2025, "Ano fora da faixa 2007-2025"),
  fonte: z.string().trim().min(1, "Fonte é obrigatória"),
  variavel: z.string().trim().min(1, "Variável é obrigatória"),
  ensino_rede: z.string().trim().min(1, "Rede de ensino é obrigatória"),
  ensino_tipo: z.string().trim().min(1, "Tipo de ensino é obrigatório"),
  valor: z.number({ invalid_type_error: "Valor deve ser numérico" })
});

export type MedidaRow = z.infer<typeof MedidaRowSchema>;

export interface UploadReport {
  linhasLidas: number;
  linhasImportadas: number;
  linhasRejeitadas: number;
  erros: { linha: number; motivo: string }[];
}

export const EXPECTED_HEADER = [
  'co_mun',
  'no_mun',
  'ano',
  'fonte',
  'variavel',
  'ensino_rede',
  'ensino_tipo',
  'valor'
];

export async function parseAndInsertCsvStream(
  inputStream: Readable,
  clearPrevious: boolean = true
): Promise<UploadReport> {
  if (clearPrevious) {
    await prisma.medida.deleteMany({});
  }

  return new Promise((resolve, reject) => {
    let headerValidated = false;
    let lineNumber = 0;
    let linesImported = 0;
    let linesRejected = 0;
    const errors: { linha: number; motivo: string }[] = [];

    const BATCH_SIZE = 3000;
    let batch: MedidaRow[] = [];

    const parser = parse({
      delimiter: ',',
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    const flushBatch = async () => {
      if (batch.length === 0) return;
      const currentBatch = batch;
      batch = [];
      await prisma.medida.createMany({
        data: currentBatch,
      });
      linesImported += currentBatch.length;
    };

    parser.on('readable', async () => {
      let record;
      while ((record = parser.read()) !== null) {
        lineNumber++;

        // 1. Validate Header
        if (!headerValidated) {
          headerValidated = true;
          const headerMatches =
            record.length === EXPECTED_HEADER.length &&
            record.every((col: string, idx: number) => col.trim().toLowerCase() === EXPECTED_HEADER[idx].toLowerCase());

          if (!headerMatches) {
            parser.destroy();
            return reject(
              new Error(
                `Cabeçalho CSV inválido. Esperado: '${EXPECTED_HEADER.join(',')}', recebido: '${record.join(',')}'`
              )
            );
          }
          continue; // Skip processing the header row as data
        }

        // 2. Row record validation
        if (record.length < 8) {
          linesRejected++;
          if (errors.length < 100) {
            errors.push({ linha: lineNumber, motivo: 'Linha com número de colunas insuficiente' });
          }
          continue;
        }

        const [co_mun, no_mun, rawAno, fonte, variavel, ensino_rede, ensino_tipo, rawValor] = record;

        const parsedAno = parseInt(rawAno, 10);
        const parsedValor = parseFloat(rawValor);

        const rowData = {
          co_mun: String(co_mun).trim(), // Preserved strictly as string
          no_mun: String(no_mun).trim(),
          ano: parsedAno,
          fonte: String(fonte).trim(),
          variavel: String(variavel).trim(),
          ensino_rede: String(ensino_rede).trim(),
          ensino_tipo: String(ensino_tipo).trim(),
          valor: parsedValor,
        };

        const validation = MedidaRowSchema.safeParse(rowData);

        if (!validation.success) {
          linesRejected++;
          if (errors.length < 100) {
            const msg = validation.error.issues.map((i) => i.message).join('; ');
            errors.push({ linha: lineNumber, motivo: msg });
          }
          continue;
        }

        batch.push(validation.data);

        if (batch.length >= BATCH_SIZE) {
          parser.pause();
          try {
            await flushBatch();
          } catch (err: any) {
            parser.destroy();
            return reject(err);
          }
          parser.resume();
        }
      }
    });

    parser.on('error', (err) => {
      reject(new Error(`Erro ao ler arquivo CSV: ${err.message}`));
    });

    parser.on('end', async () => {
      try {
        if (!headerValidated) {
          // File was empty
          return resolve({
            linhasLidas: 0,
            linhasImportadas: 0,
            linhasRejeitadas: 0,
            erros: [],
          });
        }
        await flushBatch();
        const dataLinesRead = lineNumber > 0 ? lineNumber - 1 : 0;
        resolve({
          linhasLidas: dataLinesRead,
          linhasImportadas: linesImported,
          linhasRejeitadas: linesRejected,
          erros: errors,
        });
      } catch (err: any) {
        reject(err);
      }
    });

    inputStream.pipe(parser);
  });
}
