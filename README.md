# API de OCR - Conversor de Imagem para Texto

API REST que converte imagens para texto usando OCR (Tesseract.js) através de upload de arquivos.

## Instalação

```bash
npm install
```

## Como Executar

```bash
npm start
```

A API estará disponível em `http://localhost:3000`

### Mudar a Porta

```bash
PORT=8080 npm start
```

## Endpoints

### GET `/`
Retorna informações sobre a API e documentação.

**Exemplo:**
```bash
curl http://localhost:3000/
```

**Resposta:**
```json
{
  "status": "online",
  "versao": "1.0.0",
  "nome": "API de OCR - Conversor de Imagem para Texto",
  "endpoints": {
    "ocr": {
      "metodo": "POST",
      "url": "/ocr",
      "descricao": "Extrai texto de imagem através de upload de arquivo",
      "content_type": "multipart/form-data",
      "parametros": {
        "image": "file (imagem) - obrigatório",
        "idioma": "string - opcional (padrão: 'por')"
      },
      "formatos_suportados": ["JPEG", "PNG", "GIF", "BMP", "WebP"],
      "tamanho_maximo": "50MB"
    }
  },
  "idiomas_suportados": ["por", "eng", "spa", "fra", "deu", "ita", "por+eng"]
}
```

### GET `/health`
Verifica se a API está funcionando.

**Exemplo:**
```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T19:23:17.043Z"
}
```

### POST `/ocr`
Extrai texto de uma imagem através de upload de arquivo.

**Content-Type:** `multipart/form-data`

**Parâmetros (form-data):**
- `image` (file, **obrigatório**): Arquivo de imagem (JPEG, PNG, GIF, BMP, WebP)
- `idioma` (string, opcional): Código do idioma (padrão: `por`)

**Resposta (200):**
```json
{
  "requestId": "a1b2c3d4e5f6g7h8",
  "texto": "Texto extraído da imagem",
  "confianca": 89.5,
  "palavras": 42,
  "idioma": "por",
  "arquivo": "documento.png",
  "tamanho": 245678,
  "timestamp": "2025-11-01T19:23:40.995Z"
}
```

**Campos da resposta:**
- `requestId`: ID único da requisição para rastreamento e debug
- `texto`: Texto extraído da imagem
- `confianca`: Nível de confiança do OCR (0-100)
- `palavras`: Número de palavras identificadas
- `idioma`: Idioma utilizado no processamento
- `arquivo`: Nome do arquivo original enviado
- `tamanho`: Tamanho do arquivo em bytes
- `timestamp`: Data/hora do processamento

**Resposta de Erro (400):**
```json
{
  "erro": "Campo 'image' é obrigatório",
  "exemplo": "Use form-data com o campo 'image' contendo o arquivo de imagem"
}
```

**Resposta de Erro (500):**
```json
{
  "erro": "Erro ao processar imagem",
  "mensagem": "Descrição do erro"
}
```

## Exemplos de Uso

### 1. cURL

```bash
curl -X POST http://localhost:3000/ocr \
  -F "image=@caminho/para/imagem.png" \
  -F "idioma=por"
```

### 2. JavaScript (Frontend)

```javascript
// Upload de arquivo usando FormData
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('image', file);
formData.append('idioma', 'por');

const response = await fetch('http://localhost:3000/ocr', {
  method: 'POST',
  body: formData
});

const resultado = await response.json();
console.log('Texto:', resultado.texto);
console.log('Confiança:', resultado.confianca);
console.log('Arquivo:', resultado.arquivo);
```

### 3. Node.js (usando child_process)

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Fazer requisição usando curl
const { stdout } = await execPromise(`
  curl -X POST http://localhost:3000/ocr \
    -F "image=@imagem.png" \
    -F "idioma=por"
`);

const resultado = JSON.parse(stdout);
console.log('Texto:', resultado.texto);
console.log('Confiança:', resultado.confianca + '%');
console.log('Arquivo:', resultado.arquivo);
```

### 4. Python

```python
import requests

# Upload de arquivo
with open('imagem.png', 'rb') as f:
    files = {'image': f}
    data = {'idioma': 'por'}
    response = requests.post('http://localhost:3000/ocr', files=files, data=data)

resultado = response.json()
print('Texto:', resultado['texto'])
print('Confiança:', resultado['confianca'])
print('Arquivo:', resultado['arquivo'])
```

## Idiomas Suportados

| Código | Idioma |
|--------|--------|
| `por` | Português |
| `eng` | Inglês |
| `spa` | Espanhol |
| `fra` | Francês |
| `deu` | Alemão |
| `ita` | Italiano |

**Múltiplos idiomas:**
```bash
curl -X POST http://localhost:3000/ocr \
  -F "image=@documento.png" \
  -F "idioma=por+eng"
```

## Formatos de Imagem Suportados

- JPEG/JPG
- PNG
- GIF
- BMP
- WebP

**Tamanho máximo:** 50MB por arquivo

## Concorrência e Isolamento

### ✅ Garantia de Isolamento Total

A API foi projetada para **garantir isolamento completo** entre requisições simultâneas:

**Como funciona:**
1. **ID Único por Requisição:** Cada requisição recebe um `requestId` único (16 caracteres hexadecimais)
2. **Worker Exclusivo:** Cada requisição cria seu próprio worker Tesseract independente
3. **Buffer Isolado:** Cada imagem é processada em seu próprio espaço de memória
4. **Logs Rastreáveis:** Todos os logs incluem o `requestId` para rastreamento

**Isso significa que:**
- ✅ Múltiplos usuários podem usar a API simultaneamente sem conflitos
- ✅ Cada usuário recebe APENAS o resultado da sua própria imagem
- ✅ Não há risco de "misturar" resultados entre requisições
- ✅ É seguro usar em produção com alta concorrência

**Rastreamento nos logs do servidor:**
```
[a1b2c3d4] NOVA REQUISIÇÃO INICIADA
[a1b2c3d4] Arquivo: documento.png
[a1b2c3d4] ✓ REQUISIÇÃO CONCLUÍDA COM SUCESSO

[e5f6g7h8] NOVA REQUISIÇÃO INICIADA
[e5f6g7h8] Arquivo: outro.jpg
[e5f6g7h8] ✓ REQUISIÇÃO CONCLUÍDA COM SUCESSO
```

## Uso como Módulo

Você também pode importar a função `imagemParaTexto` diretamente:

```javascript
import { imagemParaTexto } from './index.js';

// Processar imagem local
const resultado = await imagemParaTexto('imagem.png', 'por');
console.log(resultado.texto);

// Processar Buffer
const imageBuffer = fs.readFileSync('imagem.jpg');
const resultado = await imagemParaTexto(imageBuffer, 'eng');
console.log(resultado.texto);
```

## Dicas para Melhores Resultados

1. Use imagens com boa resolução (mínimo 300 DPI)
2. Certifique-se de que o texto está legível
3. Evite imagens muito escuras ou com baixo contraste
4. Fundos brancos com texto preto funcionam melhor
5. Para textos em ângulo, rotacione a imagem antes

## Limites e Performance

- **Tamanho máximo da requisição:** 50MB por arquivo
- **Timeout:** 2-30 segundos (depende do tamanho da imagem e idioma)
- **Concorrência:** Ilimitada (cada requisição é isolada)
- **Formatos aceitos:** JPEG, PNG, GIF, BMP, WebP
- **Memória:** Cada requisição usa ~200-500MB durante o processamento
- **Throughput:** ~2-10 requisições/segundo (depende do hardware)

## CORS

A API está configurada com CORS habilitado para qualquer origem.

Para restringir, edite `index.js`:

```javascript
app.use(cors({
  origin: 'https://seusite.com'
}));
```

## Deploy

### Heroku

```bash
# Criar Procfile
echo "web: node index.js" > Procfile

# Deploy
git push heroku main
```

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

## Estrutura do Projeto

```
.
├── index.js          # API + Funções OCR
├── package.json      # Configuração do projeto
├── imagem.png        # Imagem de exemplo (opcional)
└── README.md         # Documentação
```

## Tecnologias

- [Express.js](https://expressjs.com/) - Framework web
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [Multer](https://github.com/expressjs/multer) - Middleware para upload de arquivos
- [CORS](https://github.com/expressjs/cors) - Cross-Origin Resource Sharing

## Licença

MIT
