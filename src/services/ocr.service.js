import Tesseract from 'tesseract.js';

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
