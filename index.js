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

    // Processa a imagem com o ID único (cada requisição isolada)
    const resultado = await imagemParaTexto(imageBuffer, idioma, requestId);

    // Extrai dados estruturados do texto usando GPT
    var prompt = `Você é um assistente especializado em extrair dados estruturados de textos.
                    Analise o texto fornecido e extraia as seguintes informações:
                    - nome (primeiro nome)
                    - sobrenome (último nome ou nome completo sem o primeiro nome)
                    - data_nascimento (formato: DD/MM/AAAA ou AAAA-MM-DD)

                    Se algum dado não estiver presente no texto, retorne string vazia para esse campo.

                    IMPORTANTE: Retorne APENAS um objeto JSON válido no formato:
                    {"nome": "", "sobrenome": "", "data_nascimento": ""}

                    Não inclua explicações, apenas o JSON.`;
    const dadosExtraidos = await extrairDadosComGPT(resultado.texto,prompt, requestId);

    const resposta = {
      requestId: requestId, // ID para rastreamento
      texto_original: resultado.texto, // Texto original extraído do OCR
      dados_extraidos: dadosExtraidos, // Dados estruturados extraídos pelo GPT
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
