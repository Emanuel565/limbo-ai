export const metadata = {
    title: "Termos de Serviço | Limbo AI",
    description: "Termos de Serviço oficiais da plataforma Limbo AI.",
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#14010e] text-slate-100 py-16 px-4">
            <div className="max-w-4xl mx-auto belve-card rounded-3xl p-8 md:p-12 border border-[#FF1493]/30 bg-black/60 shadow-2xl">
                <div className="mb-8 border-b border-white/10 pb-6">
                    <span className="text-[11px] font-heading uppercase tracking-widest text-[#FF1493] font-bold">
                        Limbo AI • Termos Legais
                    </span>
                    <h1 className="text-3xl md:text-4xl font-heading font-black text-white mt-1 uppercase tracking-tight">
                        Termos de <span className="belve-gradient-text">Serviço</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-2">
                        Última atualização: 12 de outubro de 2026 • Desenvolvido por Emanuel565
                    </p>
                </div>

                <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-light">
                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            1. Aceitação dos Termos
                        </h2>
                        <p>
                            Ao utilizar o <strong>Limbo AI</strong>, você concorda com estes Termos de Serviço e com as diretrizes das plataformas integradas, incluindo os Termos de Serviço do <strong>TikTok</strong> e as Políticas da Plataforma Meta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            2. Descrição do Serviço
                        </h2>
                        <p>
                            O Limbo AI é uma plataforma de automação e auxílio à criação de vídeos curtos que oferece:
                        </p>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-slate-300">
                            <li>Reenquadramento de vídeos para formato vertical 9:16 (1080x1920);</li>
                            <li>Geração e queima de legendas animadas em formato SubStation Alpha (.ass);</li>
                            <li>Análise heurística e preditiva de retenção para criadores de conteúdo;</li>
                            <li>Publicação programática e direta de vídeos via TikTok Content Posting API e Meta Graph API.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            3. Responsabilidade sobre o Conteúdo
                        </h2>
                        <p>
                            O criador de conteúdo é o único responsável pelos vídeos carregados, processados e publicados. O usuário compromete-se a não publicar conteúdo que viole direitos autorais de terceiros ou as Diretrizes da Comunidade do TikTok e do Instagram.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider mb-2">
                            4. Propriedade Intelectual
                        </h2>
                        <p>
                            O software Limbo AI, sua arquitetura e código-fonte são de propriedade exclusiva de <strong>Emanuel565</strong>. O código oficial está disponível no repositório:{" "}
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
