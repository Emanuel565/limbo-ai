export const metadata = {
    title: "Política de Privacidade | Limbo AI",
    description: "Política de Privacidade oficial da plataforma Limbo AI e integração com TikTok Content Posting API.",
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#14010e] text-slate-100 py-16 px-4">
            <div className="max-w-4xl mx-auto belve-card rounded-3xl p-8 md:p-12 border border-[#FF1493]/30 bg-black/60 shadow-2xl">
                <div className="mb-8 border-b border-white/10 pb-6">
                    <span className="text-[11px] font-heading uppercase tracking-widest text-[#FF1493] font-bold">
                        Limbo AI • Termos Legais
                    </span>
                    <h1 className="text-3xl md:text-4xl font-heading font-black text-white mt-1 uppercase tracking-tight">
                        Política de <span className="belve-gradient-text">Privacidade</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-2">
                        Última atualização: 12 de outubro de 2026 • Desenvolvido por Emanuel565
                    </p>
                </div>

                <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-light">
                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            1. Visão Geral
                        </h2>
                        <p>
                            A plataforma <strong>Limbo AI</strong>, desenvolvida por <strong>Emanuel565</strong>, respeita rigorosamente a privacidade de seus usuários e criadores de conteúdo. Esta política descreve como as informações são processadas ao utilizar nossas ferramentas de edição inteligente de vídeo e automação de publicação integrada às APIs oficiais do <strong>TikTok</strong> e <strong>Meta (Instagram)</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            2. Coleta e Uso de Dados
                        </h2>
                        <p>
                            Nossa aplicação opera com o princípio de coleta mínima de dados:
                        </p>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-slate-300">
                            <li><strong>Autenticação OAuth:</strong> Utilizamos o TikTok Login Kit e Meta OAuth exclusivamente para autenticar o criador e obter tokens de autorização concedidos pelo próprio usuário.</li>
                            <li><strong>Publicação de Vídeos:</strong> O acesso à <em>Content Posting API</em> do TikTok e à <em>Meta Graph API</em> é utilizado exclusivamente para publicar os vídeos (formato 9:16) e legendas aprovados pelo criador na respectiva conta.</li>
                            <li><strong>Processamento Local:</strong> Toda a renderização, cortes via GPU NVENC e geração de legendas ocorrem no ambiente da aplicação, sem venda ou compartilhamento de arquivos com terceiros.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            3. Armazenamento e Segurança dos Tokens
                        </h2>
                        <p>
                            Tokens de acesso à API (como <code>TIKTOK_ACCESS_TOKEN</code> e <code>INSTAGRAM_ACCESS_TOKEN</code>) são mantidos estritamente protegidos no ambiente do servidor do usuário (<code>.env.local</code>) e nunca são expostos publicamente, compartilhados ou comercializados.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            4. Revogação de Acesso
                        </h2>
                        <p>
                            O usuário pode a qualquer momento revogar o acesso do aplicativo diretamente pelo portal de configurações de segurança do TikTok ou do Instagram, cessando imediatamente qualquer capacidade de publicação remota.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            5. Contato
                        </h2>
                        <p>
                            Para dúvidas ou solicitações sobre esta política de privacidade, visite o repositório oficial do projeto:{" "}
                            <a
                                href="https://github.com/Emanuel565/limbo-ai"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#FF1493] underline font-medium hover:text-white"
                            >
                                https://github.com/Emanuel565/limbo-ai
                            </a>.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
