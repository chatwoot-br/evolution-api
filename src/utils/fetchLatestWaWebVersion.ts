import axios, { AxiosRequestConfig } from 'axios';
import { fetchLatestBaileysVersion, WAVersion } from 'baileys';

interface VersionResult {
  version: WAVersion;
  isLatest: boolean;
  requestIp?: string;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Busca a versão de fallback usando o Baileys
 * @returns Resultado com versão de fallback
 */
const getFallbackVersion = async (): Promise<VersionResult> => {
  try {
    const { version } = await fetchLatestBaileysVersion();
    return {
      version: version as WAVersion,
      isLatest: false,
      error: {
        message: 'Using Baileys fallback version',
        code: 'FALLBACK_VERSION',
      },
    };
  } catch (fallbackError) {
    // Se até o fallback falhar, usa versão padrão
    return {
      version: [2, 3000, 1026550512] as WAVersion, // 2025-08-31
      isLatest: false,
      error: {
        message: 'Failed to fetch any version, using default',
        code: 'DEFAULT_VERSION',
      },
    };
  }
};

/**
 * Busca a versão mais recente do WhatsApp Web
 * @param options Configurações opcionais para a requisição HTTP
 * @returns Versão do WhatsApp Web e status de atualização
 */
export const fetchLatestWaWebVersion = async (options?: AxiosRequestConfig<{}>): Promise<VersionResult> => {
  try {
    // Configuração do proxy global se disponível
    const proxyConfig: AxiosRequestConfig = {};

    if (process.env.PROXY_HOST) {
      proxyConfig.proxy = {
        host: process.env.PROXY_HOST,
        port: parseInt(process.env.PROXY_PORT || '80', 10),
        protocol: process.env.PROXY_PROTOCOL || 'http',
      };

      // Adiciona autenticação do proxy se fornecida
      if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
        proxyConfig.proxy.auth = {
          username: process.env.PROXY_USERNAME,
          password: process.env.PROXY_PASSWORD,
        };
      }
    }

    // Busca o service worker do WhatsApp Web
    const response = await axios.get('https://web.whatsapp.com/sw.js', {
      ...proxyConfig,
      ...options,
      responseType: 'text', // Corrigido: deve ser 'text' para arquivo .js
      timeout: 10000, // Timeout padrão de 10 segundos
    });

    const { data } = response;

    // Extrai o IP utilizado na requisição
    const requestIp =
      response.request?.socket?.remoteAddress || response.request?.connection?.remoteAddress || 'unknown';

    // Busca pelo client revision usando múltiplas estratégias de regex
    let clientRevision: number | null = null;

    const regexPatterns = [
      /"client_revision":\s*(\d+)/g, // Formato padrão JSON
      /client_revision\\?":\s*(\d+)/g, // Com escape simples
      /"client_revision\\?":\s*(\d+)/g, // Com aspas e escape
      /SiteData.*?client_revision.*?(\d{10,})/g, // Busca mais ampla
    ];

    for (const regex of regexPatterns) {
      const match = data.match(regex);
      if (match) {
        // Extrai todos os números de 10+ dígitos encontrados
        const numbers = match.join(' ').match(/\d{10,}/g);
        if (numbers && numbers.length > 0) {
          clientRevision = parseInt(numbers[0], 10);
          break;
        }
      }
    }

    if (!clientRevision || isNaN(clientRevision) || clientRevision <= 0) {
      return {
        ...(await getFallbackVersion()),
        requestIp,
        error: {
          message: 'Could not find client revision in WhatsApp Web service worker',
          code: 'REVISION_NOT_FOUND',
        },
      };
    }

    return {
      version: [2, 3000, clientRevision] as WAVersion,
      isLatest: true,
      requestIp,
    };
  } catch (error) {
    // Tratamento específico para diferentes tipos de erro
    const errorMessage = axios.isAxiosError(error)
      ? `Network error: ${error.message}`
      : 'Unknown error occurred while fetching WhatsApp Web version';

    const fallbackResult = await getFallbackVersion();

    return {
      ...fallbackResult,
      error: {
        message: errorMessage,
        code: axios.isAxiosError(error) ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      },
    };
  }
};
