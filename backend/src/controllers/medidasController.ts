import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { parseAndInsertCsvStream } from '../services/csvStreamParser';
import {
  getFiltros,
  getIndicadores,
  getSeries,
  getRanking,
  getMapaData,
  getDistribuicao,
  getTabelaDados,
  invalidarCacheAnos,
} from '../repository/medidasRepository';

export const medidasRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Formato de arquivo inválido. Por favor, envie um arquivo .csv'));
    }
    cb(null, true);
  },
});

// Helper for parsing multi-value or single query parameters
function parseQueryParams(req: Request) {
  const { municipio, anoInicio, anoFim, rede, etapa, variavel, visao, pagina, tamanho, limite } = req.query;

  let municipios: string[] | undefined;
  if (municipio) {
    if (Array.isArray(municipio)) {
      municipios = municipio.map(String);
    } else {
      municipios = String(municipio).split(',').filter(Boolean);
    }
  }

  const parsedAnoInicio = anoInicio ? parseInt(String(anoInicio), 10) : undefined;
  const parsedAnoFim = anoFim ? parseInt(String(anoFim), 10) : undefined;

  if (parsedAnoInicio !== undefined && parsedAnoFim !== undefined && parsedAnoInicio > parsedAnoFim) {
    const error: any = new Error('O ano inicial deve ser menor ou igual ao ano final.');
    error.statusCode = 400;
    error.code = 'INVALID_YEAR_RANGE';
    throw error;
  }

  return {
    municipios,
    anoInicio: parsedAnoInicio,
    anoFim: parsedAnoFim,
    rede: rede && rede !== 'Todos' ? String(rede) : undefined,
    etapa: etapa && etapa !== 'Todas' ? String(etapa) : undefined,
    variavel: variavel ? String(variavel) : undefined,
    visao: visao === 'etapa' ? ('etapa' as const) : ('rede' as const),
    pagina: pagina ? parseInt(String(pagina), 10) : 1,
    tamanho: tamanho ? parseInt(String(tamanho), 10) : 10,
    limite: limite ? parseInt(String(limite), 10) : 10,
  };
}

// POST /api/upload
medidasRouter.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'Nenhum arquivo CSV enviado' } });
      }

      const stream = Readable.from(req.file.buffer);
      const report = await parseAndInsertCsvStream(stream, true);

      // Invalida cache de anos após nova importação
      invalidarCacheAnos();

      return res.status(200).json(report);
    } catch (error: any) {
      return res.status(400).json({ error: { code: 'INVALID_CSV', message: error.message || 'Erro ao processar CSV' } });
    }
  }
);

// GET /api/filtros
medidasRouter.get('/filtros', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filtros = await getFiltros();
    res.json(filtros);
  } catch (error) {
    next(error);
  }
});

// GET /api/indicadores
medidasRouter.get('/indicadores', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseQueryParams(req);
    const result = await getIndicadores(params);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/series
medidasRouter.get('/series', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseQueryParams(req);
    const variavel = params.variavel || 'Matrícula';
    const series = await getSeries({ ...params, variavel });
    res.json(series);
  } catch (error) {
    next(error);
  }
});

// GET /api/ranking
medidasRouter.get('/ranking', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseQueryParams(req);
    const variavel = params.variavel || 'Matrícula';
    const ranking = await getRanking({ ...params, variavel, limite: params.limite });
    res.json(ranking);
  } catch (error) {
    next(error);
  }
});

// GET /api/mapa
medidasRouter.get('/mapa', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseQueryParams(req);
    const variavel = params.variavel || 'Matrícula';
    const mapa = await getMapaData({ ...params, variavel });
    res.json(mapa);
  } catch (error) {
    next(error);
  }
});

// GET /api/distribuicao
medidasRouter.get('/distribuicao', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseQueryParams(req);
    const variavel = params.variavel || 'Matrícula';
    const distribuicao = await getDistribuicao({ ...params, variavel });
    res.json(distribuicao);
  } catch (error) {
    next(error);
  }
});

// GET /api/dados
medidasRouter.get('/dados', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseQueryParams(req);
    const tabela = await getTabelaDados(params);
    res.json(tabela);
  } catch (error) {
    next(error);
  }
});
