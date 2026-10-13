import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const envFilePath = path.join(process.cwd(), ".env.local");

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const code = String(body?.code || "").trim();

        if (!code) {
            return NextResponse.json({ ok: false, error: "O parâmetro 'code' de autorização é obrigatório." }, { status: 400 });
        }

        const clientKey = process.env.TIKTOK_CLIENT_KEY || "sbawes5f6trrwixg9i";
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET || "C7jM01zBkFJq6Nvsw0EfPt0utUdjtRBq";
        const redirectUri = process.env.TIKTOK_REDIRECT_URI || "https://emanuel565.github.io/limbo-ai/";

        // Troca o código temporário por Access Token oficial
        const params = new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
        });

        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cache-Control": "no-cache",
            },
            body: params.toString(),
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || tokenData.error?.code !== "ok" && tokenData.error?.message) {
            const errorMsg = tokenData.error_description || tokenData.error?.message || tokenData.message || "Falha na troca de token do TikTok";
            return NextResponse.json({ ok: false, error: errorMsg, raw: tokenData }, { status: 400 });
        }

        const accessToken = tokenData.data?.access_token || tokenData.access_token;
        const openId = tokenData.data?.open_id || tokenData.open_id;
        const refreshToken = tokenData.data?.refresh_token || tokenData.refresh_token;

        if (accessToken) {
            // Salva no .env.local
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

            setVal("TIKTOK_ACCESS_TOKEN", accessToken);
            if (openId) setVal("TIKTOK_OPEN_ID", openId);
            if (refreshToken) setVal("TIKTOK_REFRESH_TOKEN", refreshToken);

            await writeFile(envFilePath, envContent.trim() + "\n", "utf8");
        }

        return NextResponse.json({
            ok: true,
            message: "Token do TikTok gerado e salvo com sucesso em .env.local!",
            openId,
            accessTokenPreview: accessToken ? `${accessToken.slice(0, 6)}••••••••` : null,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao processar token do TikTok.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
