import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const envFilePath = path.join(process.cwd(), ".env.local");

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const token = String(body?.accessToken || "").trim();

        if (!token) {
            return NextResponse.json(
                { ok: false, error: "Informe o Meta Access Token (User ou Page Token)." },
                { status: 400 }
            );
        }

        // 1. Consulta as páginas do usuário e as contas do Instagram conectadas
        const url = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || data.error) {
            const errorMsg = data.error?.message || "Token inválido ou sem permissão na Meta Graph API.";
            return NextResponse.json({ ok: false, error: errorMsg }, { status: 400 });
        }

        const accounts = data.data || [];
        const igAccounts: Array<{
            pageName: string;
            pageId: string;
            pageAccessToken?: string;
            igId: string;
            username: string;
            name?: string;
            profilePicture?: string;
        }> = [];

        for (const page of accounts) {
            if (page.instagram_business_account) {
                igAccounts.push({
                    pageName: page.name,
                    pageId: page.id,
                    pageAccessToken: page.access_token,
                    igId: page.instagram_business_account.id,
                    username: page.instagram_business_account.username || "",
                    name: page.instagram_business_account.name || "",
                    profilePicture: page.instagram_business_account.profile_picture_url || "",
                });
            }
        }

        if (igAccounts.length === 0) {
            // Tenta consultar diretamente se for um Instagram User Token (Instagram Basic Display / Login)
            const meUrl = `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`;
            const meRes = await fetch(meUrl);
            const meData = await meRes.json();

            return NextResponse.json({
                ok: false,
                error: "Nenhuma conta profissional do Instagram vinculada foi encontrada nesta conta do Facebook.",
                hint: "Certifique-se de que seu Instagram é Criador de Conteúdo/Comercial e está vinculado a uma Página do Facebook.",
                raw: { user: meData, pagesCount: accounts.length },
            }, { status: 404 });
        }

        // Salva a primeira conta encontrada automaticamente no .env.local
        const selected = igAccounts[0];
        let envContent = await readFile(envFilePath, "utf8").catch(() => "");

        const setVal = (key: string, val: string) => {
            const regex = new RegExp(`^${key}=.*$`, "m");
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${val}`);
            } else {
                envContent += `\n${key}=${val}`;
            }
            process.env[key] = val;
        };

        setVal("INSTAGRAM_ACCESS_TOKEN", selected.pageAccessToken || token);
        setVal("INSTAGRAM_BUSINESS_ACCOUNT_ID", selected.igId);
        if (selected.username) setVal("INSTAGRAM_USERNAME", selected.username);

        await writeFile(envFilePath, envContent.trim() + "\n", "utf8");

        return NextResponse.json({
            ok: true,
            message: `Conta Instagram @${selected.username} conectada com sucesso!`,
            account: selected,
            allFound: igAccounts,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao detectar conta do Instagram.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
