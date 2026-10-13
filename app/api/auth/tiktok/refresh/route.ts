import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const envFilePath = path.join(process.cwd(), ".env.local");

export async function POST() {
    try {
        let envContent = await readFile(envFilePath, "utf8").catch(() => "");
        const clientKey = (envContent.match(/^TIKTOK_CLIENT_KEY=(.*)$/m) || [])[1] || process.env.TIKTOK_CLIENT_KEY || "sbawes5f6trrwixg9i";
        const clientSecret = (envContent.match(/^TIKTOK_CLIENT_SECRET=(.*)$/m) || [])[1] || process.env.TIKTOK_CLIENT_SECRET || "C7jM01zBkFJq6Nvsw0EfPt0utUdjtRBq";
        const refreshToken = (envContent.match(/^TIKTOK_REFRESH_TOKEN=(.*)$/m) || [])[1] || process.env.TIKTOK_REFRESH_TOKEN;

        if (!refreshToken) {
            return NextResponse.json({ ok: false, error: "Nenhum TIKTOK_REFRESH_TOKEN encontrado no .env.local" }, { status: 400 });
        }

        const params = new URLSearchParams({
            client_key: clientKey.trim(),
            client_secret: clientSecret.trim(),
            grant_type: "refresh_token",
            refresh_token: refreshToken.trim(),
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
            const errorMsg = tokenData.error_description || tokenData.error?.message || tokenData.message || "Falha na renovação do token do TikTok";
            return NextResponse.json({ ok: false, error: errorMsg, raw: tokenData }, { status: 400 });
        }

        const accessToken = tokenData.data?.access_token || tokenData.access_token;
        const openId = tokenData.data?.open_id || tokenData.open_id;
        const newRefreshToken = tokenData.data?.refresh_token || tokenData.refresh_token;

        if (accessToken) {
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
            if (newRefreshToken) setVal("TIKTOK_REFRESH_TOKEN", newRefreshToken);

            await writeFile(envFilePath, envContent.trim() + "\n", "utf8");
        }

        return NextResponse.json({
            ok: true,
            message: "Token de acesso do TikTok renovado com sucesso por mais 24h!",
            expiresIn: tokenData.expires_in || 86400,
            refreshExpiresIn: tokenData.refresh_expires_in || 31536000,
            openId,
            accessTokenPreview: accessToken ? `${accessToken.slice(0, 6)}••••••••` : null,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao renovar token do TikTok.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
