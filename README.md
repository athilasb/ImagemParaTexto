# API de OCR - Conversor de Imagem para Texto com IA

API REST que converte imagens para texto usando OCR (Tesseract.js) e extrai dados estruturados **customizáveis** usando GPT-4.

## 🚀 Funcionalidades

- ✅ **OCR Avançado:** Extração de texto de imagens com Tesseract.js
- ✅ **Extração de Dados Customizável com IA:** GPT-4 analisa o texto e extrai **QUALQUER campo** que você definir:
  - Nome, sobrenome, data de nascimento (padrão)
  - Título, texto, data
  - Empresa, CNPJ, endereço, telefone
  - **OU QUALQUER OUTRO CAMPO QUE VOCÊ PRECISAR!**
- ✅ **Upload de Arquivos:** Envie imagens diretamente (multipart/form-data)
- ✅ **Isolamento Total:** Cada requisição é completamente isolada
- ✅ **Múltiplos Idiomas:** Português, Inglês, Espanhol, Francês, Alemão, Italiano
- ✅ **Rastreamento:** RequestId único para cada processamento

## Instalação

```bash
npm install
```

## Configuração

1. **Configure a chave da OpenAI:**

Crie um arquivo `.env` na raiz do projeto (ou copie `.env.example`):

```bash
# .env
OPENAI_API_KEY=sk-proj-sua-chave-aqui
PORT=3000
```

**⚠️ IMPORTANTE:** A chave da OpenAI é **obrigatória** para a extração de dados. Sem ela, a API irá funcionar apenas para OCR, retornando dados_extraidos vazios.

2. **Obter chave da OpenAI:**
   - Acesse https://platform.openai.com/api-keys
   - Crie uma nova chave de API
   - Cole no arquivo `.env`

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
Extrai texto de uma imagem através de upload de arquivo e analisa com IA para extrair dados estruturados **customizáveis**.

**Content-Type:** `multipart/form-data`

**Parâmetros (form-data):**
- `image` (file, **obrigatório**): Arquivo de imagem (JPEG, PNG, GIF, BMP, WebP)
- `idioma` (string, opcional): Código do idioma (padrão: `por`)
- `campos` (string JSON, opcional): Array com os campos a extrair (padrão: `["nome", "sobrenome", "data_nascimento"]`)

**Exemplos de campos personalizados:**
```json
["titulo", "texto", "data"]
["empresa", "cnpj", "endereco", "telefone"]
["produto", "preco", "quantidade"]
["nome_paciente", "medicamento", "dosagem"]
```

**Resposta (200) - Exemplo com campos padrão:**
```json
{
  "requestId": "a1b2c3d4e5f6g7h8",
  "texto_original": "Nome: João Silva\nData de Nascimento: 15/03/1990\nCPF: 123.456.789-00",
  "dados_extraidos": {
    "nome": "João",
    "sobrenome": "Silva",
    "data_nascimento": "15/03/1990"
  },
  "campos_solicitados": ["nome", "sobrenome", "data_nascimento"],
  "confianca": 89.5,
  "palavras": 42,
  "idioma": "por",
  "arquivo": "documento.png",
  "tamanho": 245678,
  "timestamp": "2025-11-01T19:23:40.995Z"
}
```

**Resposta (200) - Exemplo com campos customizados:**
```json
{
  "requestId": "x9y8z7w6v5u4t3s2",
  "texto_original": "Título: Relatório de Vendas\n\nData: 10/01/2025\nTexto: As vendas aumentaram 25%...",
  "dados_extraidos": {
    "titulo": "Relatório de Vendas",
    "texto": "As vendas aumentaram 25%...",
    "data": "10/01/2025"
  },
  "campos_solicitados": ["titulo", "texto", "data"],
  "confianca": 92.3,
  "palavras": 58,
  "idioma": "por",
  "arquivo": "relatorio.png",
  "tamanho": 312456,
  "timestamp": "2025-11-01T19:30:15.789Z"
}
```

**Campos da resposta:**
- `requestId`: ID único da requisição para rastreamento e debug
- `texto_original`: Texto completo extraído da imagem via OCR
- `dados_extraidos`: Objeto com os campos solicitados extraídos pelo GPT-4 (valores vazios se não encontrados)
- `campos_solicitados`: Array com os campos que foram solicitados para extração
- `confianca`: Nível de confiança do OCR (0-100)
- `palavras`: Número de palavras identificadas no OCR
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

### 1. cURL - Campos Padrão

```bash
curl -X POST http://localhost:3000/ocr \
  -F "image=@caminho/para/imagem.png" \
  -F "idioma=por"
```

### 2. cURL - Campos Customizados

```bash
# Extrair título, texto e data
curl -X POST http://localhost:3000/ocr \
  -F "image=@documento.png" \
  -F 'campos=["titulo", "texto", "data"]'

# Extrair dados empresariais
curl -X POST http://localhost:3000/ocr \
  -F "image=@cartao.png" \
  -F 'campos=["empresa", "cnpj", "endereco", "telefone", "email"]'

# Extrair dados de nota fiscal
curl -X POST http://localhost:3000/ocr \
  -F "image=@nota.png" \
  -F 'campos=["numero_nota", "data_emissao", "valor_total", "nome_fornecedor"]'
```

### 3. JavaScript (Frontend)

```javascript
// Upload de arquivo usando FormData com campos padrão
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
console.log('Texto:', resultado.texto_original);
console.log('Dados:', resultado.dados_extraidos);
console.log('Confiança:', resultado.confianca);
```

### 4. JavaScript - Com Campos Customizados

```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('campos', JSON.stringify(['titulo', 'texto', 'data']));

const response = await fetch('http://localhost:3000/ocr', {
  method: 'POST',
  body: formData
});

const resultado = await response.json();
console.log('Título:', resultado.dados_extraidos.titulo);
console.log('Texto:', resultado.dados_extraidos.texto);
console.log('Data:', resultado.dados_extraidos.data);
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

### 5. Python - Com Campos Customizados

```python
import requests
import json

# Upload de arquivo com campos personalizados
with open('imagem.png', 'rb') as f:
    files = {'image': f}
    data = {
        'idioma': 'por',
        'campos': json.dumps(['titulo', 'texto', 'data'])
    }
    response = requests.post('http://localhost:3000/ocr', files=files, data=data)

resultado = response.json()
print('Título:', resultado['dados_extraidos']['titulo'])
print('Texto:', resultado['dados_extraidos']['texto'])
print('Data:', resultado['dados_extraidos']['data'])
print('Campos:', resultado['campos_solicitados'])
```

## 📋 Exemplos de Campos Customizáveis

A API é **totalmente flexível**! Você pode extrair qualquer tipo de informação definindo os campos desejados:

### Documentos de Identidade
```json
["nome", "rg", "cpf", "data_nascimento", "orgao_emissor"]
```

### Contratos
```json
["titulo_contrato", "partes_envolvidas", "data_assinatura", "valor", "prazo"]
```

### Receitas Médicas
```json
["nome_paciente", "medicamento", "dosagem", "frequencia", "medico", "crm"]
```

### Comprovantes Bancários
```json
["tipo_comprovante", "valor", "data", "beneficiario", "banco", "agencia"]
```

### Notas Fiscais
```json
["numero_nota", "data_emissao", "valor_total", "nome_fornecedor", "cnpj"]
```

### Cardápios de Restaurante
```json
["nome_prato", "preco", "ingredientes", "categoria"]
```

### Cartões de Visita
```json
["nome", "cargo", "empresa", "telefone", "email", "endereco"]
```

### Certificados
```json
["nome_pessoa", "titulo_certificado", "data_emissao", "instituicao", "carga_horaria"]
```

### Currículos
```json
["nome", "email", "telefone", "experiencia_profissional", "formacao", "habilidades"]
```

### **E muito mais!** Defina os campos que você precisa!

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

## 🤖 Extração de Dados Customizável com IA

A API utiliza **GPT-4o-mini** da OpenAI para analisar automaticamente o texto extraído e identificar **QUALQUER dado estruturado** que você definir.

### Como funciona:

1. **OCR (Tesseract):** Extrai todo o texto da imagem
2. **Definição de Campos:** Você escolhe quais campos quer extrair
3. **Análise IA (GPT-4):** Processa o texto e extrai os campos solicitados

### Campos Padrão (se não especificar):
   - **Nome:** Primeiro nome da pessoa
   - **Sobrenome:** Sobrenome ou resto do nome completo
   - **Data de Nascimento:** Em formato DD/MM/AAAA ou AAAA-MM-DD

### Exemplos de Extração:

**Exemplo 1 - Documento de Identidade:**
```
Texto OCR: "Nome: Maria Santos\nData de Nascimento: 20/05/1985\nRG: 12.345.678-9"

Dados Extraídos:
{
  "nome": "Maria",
  "sobrenome": "Santos",
  "data_nascimento": "20/05/1985"
}
```

**Exemplo 2 - Carteira de Motorista:**
```
Texto OCR: "CARLOS EDUARDO OLIVEIRA\nNasc.: 1990-12-15\nCPF: 987.654.321-00"

Dados Extraídos:
{
  "nome": "Carlos",
  "sobrenome": "Eduardo Oliveira",
  "data_nascimento": "1990-12-15"
}
```

**Exemplo 3 - Sem Dados Completos:**
```
Texto OCR: "Este é um texto sem informações pessoais"

Dados Extraídos:
{
  "nome": "",
  "sobrenome": "",
  "data_nascimento": ""
}
```

**Exemplo 4 - Nota Fiscal com Campos Customizados:**
```bash
# Requisição
curl -X POST http://localhost:3000/ocr \
  -F "image=@nota_fiscal.png" \
  -F 'campos=["numero_nota", "data_emissao", "valor_total", "nome_fornecedor"]'

# Texto OCR extraído
"NOTA FISCAL ELETRÔNICA
Nº 12345
Data de Emissão: 15/01/2025
Fornecedor: Empresa ABC LTDA
Valor Total: R$ 1.500,00"

# Dados Extraídos pelo GPT
{
  "numero_nota": "12345",
  "data_emissao": "15/01/2025",
  "valor_total": "R$ 1.500,00",
  "nome_fornecedor": "Empresa ABC LTDA"
}
```

**Exemplo 5 - Cartão de Visita com Campos Customizados:**
```bash
# Requisição
curl -X POST http://localhost:3000/ocr \
  -F "image=@cartao_visita.png" \
  -F 'campos=["nome", "cargo", "empresa", "telefone", "email"]'

# Texto OCR extraído
"João Pedro Silva
Gerente de Vendas
TechSolutions Ltda
(11) 98765-4321
joao.silva@techsolutions.com.br"

# Dados Extraídos pelo GPT
{
  "nome": "João Pedro Silva",
  "cargo": "Gerente de Vendas",
  "empresa": "TechSolutions Ltda",
  "telefone": "(11) 98765-4321",
  "email": "joao.silva@techsolutions.com.br"
}
```

### Vantagens:

- ✅ **Inteligente:** Entende contexto e variações de formato
- ✅ **Flexível:** Funciona com qualquer tipo de documento
- ✅ **Customizável:** Você define exatamente quais campos quer extrair
- ✅ **Seguro:** Retorna vazios quando não encontra dados
- ✅ **Preciso:** Usa GPT-4 para análise semântica avançada

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
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine para extração de texto
- [OpenAI GPT-4](https://openai.com/) - IA para extração de dados estruturados
- [Multer](https://github.com/expressjs/multer) - Middleware para upload de arquivos
- [CORS](https://github.com/expressjs/cors) - Cross-Origin Resource Sharing

## Licença

MIT
