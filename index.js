import express from 'express';
import cors from 'cors';
import Tesseract from 'tesseract.js';
import multer from 'multer';
import crypto from 'crypto';

// ============================================
// FUNÇÕES OCR
// ============================================

/**
 * Converte uma imagem em texto usando OCR
 * @param {string|Buffer} imagem - Caminho para a imagem ou Buffer
 * @param {string} idioma - Idioma do texto na imagem (padrão: 'por' para português)
 * @param {string} requestId - ID único da requisição para rastreamento
 * @returns {Promise<Object>} Objeto com o texto extraído e informações adicionais
 */
export async function imagemParaTexto(imagem, idioma = 'por', requestId = 'local') {
  // Cria um worker EXCLUSIVO para esta requisição (isolamento total)
  let worker = null;

  try {
    console.log(`[${requestId}] Criando worker exclusivo para esta requisição`);

    // Cada requisição tem seu próprio worker - ISOLAMENTO GARANTIDO
    worker = await Tesseract.createWorker(idioma, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const progresso = Math.round(m.progress * 100);
          console.log(`[${requestId}] Progresso: ${progresso}%`);
        }
      }
    });

    console.log(`[${requestId}] Worker criado, iniciando reconhecimento`);

    // Processa a imagem com o worker exclusivo desta requisição
    const { data } = await worker.recognize(imagem);

    console.log(`[${requestId}] Reconhecimento concluído`);

    return {
      texto: data.text.trim(),
      confianca: data.confidence,
      palavras: data.words.length,
      detalhes: data,
      requestId: requestId
    };
  } catch (erro) {
    console.error(`[${requestId}] Erro ao processar imagem:`, erro.message);
    throw erro;
  } finally {
    // SEMPRE termina o worker, mesmo em caso de erro
    if (worker) {
      try {
        await worker.terminate();
        console.log(`[${requestId}] Worker finalizado e recursos liberados`);
      } catch (err) {
        console.error(`[${requestId}] Erro ao finalizar worker:`, err.message);
      }
    }
  }
}

// ============================================
// API REST
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Multer para upload de arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use: JPEG, PNG, GIF, BMP ou WebP'));
    }
  }
});

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
      console.log(`[${requestId}] Requisição rejeitada - Nenhum arquivo enviado`);
      return res.status(400).json({
        erro: 'Campo "image" é obrigatório',
        exemplo: 'Use form-data com o campo "image" contendo o arquivo de imagem',
        requestId: requestId
      });
    }

    const idioma = req.body.idioma || 'por';
    const imageBuffer = req.file.buffer;

    console.log(`[${requestId}] NOVA REQUISIÇÃO INICIADA`);
    console.log(`[${requestId}] Arquivo: ${req.file.originalname}`);
    console.log(`[${requestId}] Tamanho: ${imageBuffer.length} bytes`);
    console.log(`[${requestId}] Idioma: ${idioma}`);
    console.log(`[${requestId}] Timestamp: ${timestamp}`);

    // Processa a imagem com o ID único (cada requisição isolada)
    const resultado = await imagemParaTexto(imageBuffer, idioma, requestId);

    const resposta = {
      requestId: requestId, // ID para rastreamento
      texto: resultado.texto,
      confianca: resultado.confianca,
      palavras: resultado.palavras,
      idioma: idioma,
      arquivo: req.file.originalname,
      tamanho: req.file.size,
      timestamp: timestamp
    };

    console.log(`[${requestId}] ✓ REQUISIÇÃO CONCLUÍDA COM SUCESSO`);
    console.log(`[${requestId}] Confiança: ${resposta.confianca.toFixed(2)}%`);
    console.log(`[${requestId}] Palavras extraídas: ${resposta.palavras}`);

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
  res.json({
    status: 'online',
    versao: '1.0.0',
    nome: 'API de OCR - Conversor de Imagem para Texto',
    endpoints: {
      ocr: {
        metodo: 'POST',
        url: '/ocr',
        descricao: 'Extrai texto de imagem através de upload de arquivo',
        content_type: 'multipart/form-data',
        parametros: {
          image: 'file (imagem) - obrigatório',
          idioma: 'string - opcional (padrão: "por")'
        },
        formatos_suportados: ['JPEG', 'PNG', 'GIF', 'BMP', 'WebP'],
        tamanho_maximo: '50MB'
      }
    },
    idiomas_suportados: ['por', 'eng', 'spa', 'fra', 'deu', 'ita', 'por+eng']
  });
});

// Endpoint de saúde - GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`\n🚀 API de OCR rodando em http://localhost:${PORT}`);
  console.log(`\n📖 Documentação: GET http://localhost:${PORT}`);
  console.log(`🔍 Processar imagem: POST http://localhost:${PORT}/ocr`);
  console.log(`\nExemplo de uso:`);
  console.log(`curl -X POST http://localhost:${PORT}/ocr \\`);
  console.log(`  -F "image=@caminho/para/imagem.png" \\`);
  console.log(`  -F "idioma=por"\n`);
});

export default app;
