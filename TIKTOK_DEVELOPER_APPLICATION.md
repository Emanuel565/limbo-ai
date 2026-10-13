# 📋 Formulário de Aprovação — TikTok Developer Portal
## Projeto: Limbo AI (`Emanuel565/limbo-ai`)

Este documento contém todas as informações do projeto formatadas para você **copiar e colar diretamente** nos campos obrigatórios do [TikTok Developer Portal](https://developers.tiktok.com/) para obter a aprovação da **Content Posting API v2** e do **Login Kit** sem rejeições.

---

### 1. Nome do Aplicativo (*App Name*)
> **Limite:** Máximo de 50 caracteres  
> **Nome oficial sugerido:**

```text
Limbo AI Studio
```
*(Alternativa: `Limbo AI AutoShorts`)*

---

### 2. Descrição do Aplicativo (*App Description*)
> **Limite:** Máximo de 120 caracteres (contagem exata: 105 caracteres)

```text
Ferramenta inteligente de edição 9:16 e publicação de vídeos curtos para criadores de conteúdo no TikTok.
```

---

### 3. Categoria do Aplicativo (*Category*)
- **Opção recomendada:** `Creator Tools` *(ou `Video & Photo` / `Productivity`)*

---

### 4. URLs Obrigatórias (Termos, Política e Site no GitHub Pages)

| Campo no Formulário do TikTok | URL Válida Oficial (HTTPS) |
|---|---|
| **Website / Desktop URL \*** | `https://emanuel565.github.io/limbo-ai/` |
| **Terms of Service URL \*** | `https://emanuel565.github.io/limbo-ai/terms.html` |
| **Privacy Policy URL \*** | `https://emanuel565.github.io/limbo-ai/privacy.html` |

> 🌐 **Links hospedados no GitHub Pages:** As páginas estáticas oficiais foram criadas na pasta `/docs` do repositório `Emanuel565/limbo-ai` e são servidas automaticamente pelo GitHub Pages com certificado SSL HTTPS válido.
> 
> **Para ativar no GitHub (em 1 clique):**
> 1. No repositório [github.com/Emanuel565/limbo-ai](https://github.com/Emanuel565/limbo-ai), vá em **Settings** > **Pages**
> 2. Em **Build and deployment > Source**, escolha **Deploy from a branch**
> 3. Em **Branch**, selecione `dev` (ou `main`) e a pasta `/docs` e clique em **Save**. Pronto!


---

### 5. Escopos Solicitados (*Requested Scopes*)
Marque os seguintes escopos no portal:
- `user.info.basic` (Identificação e perfil do criador)
- `video.upload` (Envio do arquivo de vídeo)
- `video.publish` (Publicação do vídeo com legendas e privacidade na conta)

---

### 6. Explicação para a Análise do Aplicativo (*Review Description / Scope Justification*)
> **Campo:** *"Explique como cada produto e escopo funciona e por que seu aplicativo precisa deles"*  
> **Copie e cole o texto completo abaixo:**

```text
O Limbo AI é uma plataforma de automação e produtividade voltada para criadores de conteúdo otimizarem o fluxo de edição e publicação de vídeos curtos verticais no TikTok.

Fluxo técnico integrado com as APIs oficiais do TikTok:

1. Autenticação Segura (Login Kit / OAuth 2.0):
O criador de conteúdo conecta sua conta do TikTok de forma segura via OAuth 2.0. O escopo `user.info.basic` é utilizado exclusivamente para identificar a conta do criador e exibir seu perfil no painel de controle.

2. Processamento Local do Vídeo:
A aplicação renderiza o corte no formato vertical exigido pelo TikTok (proporção 9:16, resolução 1080x1920, duração inferior a 60 segundos), aplicando legendas dinâmicas e normalização de áudio via aceleração por hardware local (GPU NVENC).

3. Publicação Direta (Content Posting API v2):
Utilizando os escopos `video.upload` e `video.publish`, a aplicação envia a requisição para o endpoint oficial (`/v2/post/publish/video/init/`), transferindo o vídeo e a legenda com hashtags algorítmicas (#fyp, #viral) diretamente para a conta autenticada do criador.

O usuário mantém controle total sobre os parâmetros de postagem (privacidade pública/privada, permissões de dueto e comentários). Nenhum dado do usuário ou vídeo é comercializado ou compartilhado com terceiros.

O vídeo de demonstração anexado evidencia a interface de usuário em funcionamento, mostrando a tela de configuração das credenciais e o disparo bem-sucedido da publicação via API.
```

---

### 7. Roteiro para Gravar o Vídeo de Demonstração (*Demo Video*)
> **Regra do TikTok:** O vídeo deve ter **menos de 50 MB**, em formato **.mp4** ou **.mov**, gravado em tela cheia (Full HD).

#### Roteiro de 45 a 60 segundos (Grave usando OBS Studio ou Win + Alt + R do Windows):

1. **Segundo 00 a 10:**
   - Abra o navegador em `http://localhost:3000`.
   - Mostre a interface do **Limbo AI**, navegando até a seção **"Renderização & Cortes Virais"** (`#shorts`).
2. **Segundo 10 a 25:**
   - Mostre o corte 9:16 selecionado com o mockup do smartphone, as opções de *Punch-in Zoom*, *Emojis Virais* e *Barra de Retenção*.
   - Clique em **"Renderizar 9:16 (NVENC)"** ou mostre o vídeo vertical final gerado.
3. **Segundo 25 a 45:**
   - Role até a seção **"Contas TikTok & Instagram API"** (`#social`).
   - Clique no botão rosa **"Configurar Tokens de API (TikTok / Instagram)"** para mostrar a tela onde o `TIKTOK_ACCESS_TOKEN` e `TIKTOK_OPEN_ID` são configurados.
   - Clique no botão **"Analisar Contas (IA)"** mostrando os scores de viralidade e horários ideais de postagem.
4. **Segundo 45 a 60:**
   - Clique no botão **"Publicar via API"** (ou "Preparar Legendas").
   - Mostre a confirmação na tela: `Status TikTok API: DRY_RUN_VALIDADO` (ou chamada real) com o título, hashtags (#fyp, #viral) e parâmetros de privacidade.
   - Finalize a gravação.

---

### 8. Resumo das Credenciais Geradas
Após a aprovação do TikTok Developer Portal, você receberá no painel:
- `Client Key` (App ID)
- `Client Secret`
- `Access Token` (gerado após o login da sua conta)
- `Open ID` (ID único do seu usuário)

Basta colá-los no botão **"Configurar Tokens de API"** no Limbo AI ou no arquivo `.env.local`:
```env
TIKTOK_ACCESS_TOKEN=seu_access_token_aqui
TIKTOK_OPEN_ID=seu_open_id_aqui
TIKTOK_CREATOR_USERNAME=@seu_tiktok
```
