import 'dotenv/config';
import OpenAI from 'openai';

// Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Gera um prompt dinâmico baseado nos campos solicitados
 * @param {Array<string>} campos - Lista de campos a serem extraídos
 * @returns {string} Prompt formatado para o GPT
 */
function gerarPrompt(campos) {
  const camposFormatados = campos.map(campo => `  - ${campo}`).join('\n');
  const camposJSON = campos.reduce((acc, campo) => {
    acc[campo] = "";
    return acc;
  }, {});

  return `Você é um assistente especializado em extrair dados estruturados de textos.
Analise o texto fornecido e extraia as seguintes informações:

${camposFormatados}

Se algum dado não estiver presente no texto, retorne string vazia para esse campo.

IMPORTANTE: Retorne APENAS um objeto JSON válido no formato:
${JSON.stringify(camposJSON)}

Não inclua explicações, apenas o JSON.`;
}

/**
 * Extrai dados estruturados do texto usando GPT
 * @param {string} texto - Texto extraído da imagem
 * @param {Array<string>} campos - Lista de campos a serem extraídos (ex: ["nome", "sobrenome", "data_nascimento"])
 * @param {string} requestId - ID único da requisição
 * @returns {Promise<Object>} Dados extraídos baseados nos campos solicitados
 */
export async function extrairDadosComGPT(texto, campos, requestId = 'local') {
  try {
    console.log(`[${requestId}] Iniciando extração de dados com GPT`);
    console.log(`[${requestId}] Campos solicitados:`, campos);

    const prompt = gerarPrompt(campos);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: `Extraia os dados deste texto:\n\n${texto}`
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const resposta = completion.choices[0].message.content.trim();
    console.log(`[${requestId}] Resposta do GPT: ${resposta}`);

    // Parse da resposta JSON
    let dadosExtraidos;
    try {
      dadosExtraidos = JSON.parse(resposta);
    } catch (parseError) {
      console.error(`[${requestId}] Erro ao fazer parse da resposta do GPT:`, parseError);
      // Retorna objeto vazio com os campos solicitados
      dadosExtraidos = campos.reduce((acc, campo) => {
        acc[campo] = "";
        return acc;
      }, {});
    }

    // Garante que todos os campos solicitados existem
    const resultado = campos.reduce((acc, campo) => {
      acc[campo] = dadosExtraidos[campo] || "";
      return acc;
    }, {});

    console.log(`[${requestId}] Dados extraídos:`, resultado);
    return resultado;

  } catch (erro) {
    console.error(`[${requestId}] Erro ao extrair dados com GPT:`, erro.message);
    // Em caso de erro, retorna campos vazios
    return campos.reduce((acc, campo) => {
      acc[campo] = "";
      return acc;
    }, {});
  }
}
