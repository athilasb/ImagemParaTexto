import multer from 'multer';

// Configuração do Multer para upload de arquivos em memória
export const upload = multer({
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

export const Usageshapes = {
    status: 'online',
    versao: '3.0.0',
    nome: 'API de OCR - Conversor de Imagem para Texto com Extração de Dados Customizáveis via IA',
    endpoints: {
      ocr: {
        metodo: 'POST',
        url: '/ocr',
        descricao: 'Extrai texto de imagem e dados estruturados customizáveis usando OCR + GPT',
        content_type: 'multipart/form-data',
        parametros: {
          image: 'file (imagem) - obrigatório',
          idioma: 'string - opcional (padrão: "por")',
          campos: 'array JSON string - opcional (padrão: ["nome", "sobrenome", "data_nascimento"])'
        },
        exemplos_campos: [
          '["nome", "sobrenome", "data_nascimento"]',
          '["titulo", "texto", "data"]',
          '["empresa", "cnpj", "endereco", "telefone"]',
          '["produto", "preco", "quantidade"]'
        ],
        formatos_suportados: ['JPEG', 'PNG', 'GIF', 'BMP', 'WebP'],
        tamanho_maximo: '50MB',
        resposta: {
          requestId: 'ID único da requisição',
          texto_original: 'Texto completo extraído da imagem',
          dados_extraidos: 'Objeto com os campos solicitados (valores vazios se não encontrados)',
          campos_solicitados: 'Array com os campos que foram solicitados',
          confianca: 'Confiança do OCR (0-100)',
          palavras: 'Número de palavras identificadas',
          idioma: 'Idioma utilizado',
          arquivo: 'Nome do arquivo enviado',
          tamanho: 'Tamanho em bytes',
          timestamp: 'Data/hora do processamento'
        },
        exemplo_uso: {
          curl: 'curl -X POST http://localhost:3000/ocr -F "image=@documento.png" -F \'campos=["titulo", "texto", "data"]\'',
          javascript: 'const formData = new FormData(); formData.append("image", file); formData.append("campos", JSON.stringify(["titulo", "texto", "data"]));'
        }
      }
    },
    idiomas_suportados: ['por', 'eng', 'spa', 'fra', 'deu', 'ita', 'por+eng'],
    features: [
      'OCR com Tesseract.js',
      'Extração de dados estruturados com GPT-4',
      'Campos de extração customizáveis e dinâmicos',
      'Isolamento total entre requisições',
      'Suporte a múltiplos idiomas',
      'Rastreamento com requestId único'
    ]
  };
