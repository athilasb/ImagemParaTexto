import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { imagemParaTexto } from './src/services/ocr.service.js';
import { extrairDadosComGPT } from './src/services/gpt.service.js';
import { upload , Usageshapes} from './src/config/multer.config.js';

// ============================================
// API REST
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Endpoint principal - POST /ocr (upload de arquivo)
app.post('/ocr', upload.single('image'), async (req, res) => {
  // Gera ID ÚNICO para esta requisição (garante rastreamento)
  const requestId = crypto.randomBytes(8).toString('hex');
  const timestamp = new Date().toISOString();

  try {
    if (!req.file) {
      return res.status(400).json({
        erro: 'Campo "image" é obrigatório',
        exemplo: 'Use form-data com o campo "image" contendo o arquivo de imagem',
        requestId: requestId
      });
    }

    const idioma = req.body.idioma || 'por';
    const imageBuffer = req.file.buffer;

    // Parse dos campos a serem extraídos (pode ser JSON string ou array)
    let campos = ['nome', 'sobrenome', 'data_nascimento']; // Padrão

    if (req.body.campos) {
      try {
        // Se vier como string JSON, faz parse
        campos = typeof req.body.campos === 'string'
          ? JSON.parse(req.body.campos)
          : req.body.campos;

        // Valida se é um array
        if (!Array.isArray(campos) || campos.length === 0) {
          return res.status(400).json({
            erro: 'O campo "campos" deve ser um array não vazio',
            exemplo: '["titulo", "texto", "data"] ou string JSON: \'["titulo", "texto"]\'',
            requestId: requestId
          });
        }
      } catch (parseError) {
        return res.status(400).json({
          erro: 'Erro ao fazer parse do campo "campos"',
          mensagem: 'Deve ser um array JSON válido',
          exemplo: '["titulo", "texto", "data"]',
          requestId: requestId
        });
      }
    }

    console.log(`[${requestId}] NOVA REQUISIÇÃO INICIADA`);
    console.log(`[${requestId}] Arquivo: ${req.file.originalname}`);
    console.log(`[${requestId}] Idioma: ${idioma}`);
    console.log(`[${requestId}] Campos a extrair:`, campos);

    // Processa a imagem com o ID único (cada requisição isolada)
    const resultado = await imagemParaTexto(imageBuffer, idioma, requestId);

    // Extrai dados estruturados do texto usando GPT com campos dinâmicos
    const dadosExtraidos = await extrairDadosComGPT(resultado.texto, campos, requestId);

    const resposta = {
      requestId: requestId, // ID para rastreamento
      texto_original: resultado.texto, // Texto original extraído do OCR
      dados_extraidos: dadosExtraidos, // Dados estruturados extraídos pelo GPT
      campos_solicitados: campos, // Campos que foram solicitados para extração
      confianca: resultado.confianca,
      palavras: resultado.palavras,
      idioma: idioma,
      arquivo: req.file.originalname,
      tamanho: req.file.size,
      timestamp: timestamp
    };
    
    res.json(resposta);

  } catch (erro) {
    console.error(`[${requestId}] ✗ ERRO NA REQUISIÇÃO:`, erro.message);
    res.status(500).json({
      erro: 'Erro ao processar imagem',
      mensagem: erro.message,
      requestId: requestId,
      timestamp: timestamp
    });
  }
});

// Endpoint de status - GET /
app.get('/', (req, res) => {
  res.json(Usageshapes);
});

// Endpoint de saúde - GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`\n🚀 API de OCR rodando em http://localhost:${PORT}`);
});

export default app;
