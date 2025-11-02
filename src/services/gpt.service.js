import 'dotenv/config';
import OpenAI from 'openai';

// Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extrai dados estruturados do texto usando GPT
 * @param {string} texto - Texto extraído da imagem
 * @param {string} prompt - Prompt personalizado para extração
 * @param {string} requestId - ID único da requisição
 * @returns {Promise<Object>} Dados extraídos (nome, sobrenome, data_nascimento)
 */
export async function extrairDadosComGPT(texto, prompt, requestId = 'local') {
  try {
    console.log(`[${requestId}] Iniciando extração de dados com GPT`);

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
      max_tokens: 200
    });

    const resposta = completion.choices[0].message.content.trim();
    console.log(`[${requestId}] Resposta do GPT: ${resposta}`);

    // Parse da resposta JSON
    let dadosExtraidos;
    try {
      dadosExtraidos = JSON.parse(resposta);
    } catch (parseError) {
      console.error(`[${requestId}] Erro ao fazer parse da resposta do GPT:`, parseError);
      dadosExtraidos = {
        nome: "",
        sobrenome: "",
        data_nascimento: ""
      };
    }

    // Garante que todos os campos existem
    const resultado = {
      nome: dadosExtraidos.nome || "",
      sobrenome: dadosExtraidos.sobrenome || "",
      data_nascimento: dadosExtraidos.data_nascimento || ""
    };

    console.log(`[${requestId}] Dados extraídos:`, resultado);
    return resultado;

  } catch (erro) {
    console.error(`[${requestId}] Erro ao extrair dados com GPT:`, erro.message);
    // Em caso de erro, retorna campos vazios
    return {
      nome: "",
      sobrenome: "",
      data_nascimento: ""
    };
  }
}
