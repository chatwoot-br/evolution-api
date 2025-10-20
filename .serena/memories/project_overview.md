# Evolution API - Visão Geral do Projeto

## Propósito
Evolution API é uma REST API de produção para comunicação WhatsApp que suporta múltiplos provedores WhatsApp:
- **Baileys** (WhatsApp Web) - Cliente open-source do WhatsApp Web via @whiskeysockets/baileys
- **Meta Business API** - API oficial do WhatsApp Business
- **Evolution API** - Integração WhatsApp customizada proprietária

## Objetivo Principal
Fornecer uma plataforma multi-tenant robusta para gerenciar múltiplas instâncias WhatsApp isoladas, com integrações extensivas para:
- Chatbots e plataformas de IA (OpenAI, Chatwoot, Typebot, Dify, Flowise, N8N, EvoAI)
- Sistemas CRM e atendimento ao cliente
- Plataformas de mensagens e automação
- Armazenamento de mídia (S3, MinIO)
- Sistemas de eventos e filas (RabbitMQ, SQS, NATS, Pusher, WebSocket)

## Características Principais
- **Arquitetura Multi-tenant**: Isolamento completo de instâncias no nível do banco de dados
- **Multi-provider WhatsApp**: Suporte unificado para Baileys, Business API e Evolution API
- **Multi-database**: Suporte para PostgreSQL e MySQL com schemas separados
- **Event-driven**: EventEmitter2 para eventos internos + múltiplos sistemas de eventos externos
- **Conexão persistente**: Gerenciamento de lifecycle com reconexão automática
- **Segurança**: Autenticação por API key (global e por instância), validação de input, rate limiting

## Contexto de Negócio
- **Versão**: 2.3.5
- **Licença**: Apache-2.0
- **Autor**: Davidson Gomes (contato@evolution-api.com)
- **Repositório**: https://github.com/EvolutionAPI/evolution-api
- **Package Manager**: pnpm 10.15.0+

## Palavras-chave do Domínio
chat, communication, whatsapp, whatsapp-api, whatsapp-web, automation, multi-device, bot, multi-tenant, webhook, chatbot, integration
