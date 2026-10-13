import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const envFilePath = path.join(process.cwd(), ".env.local");

function maskToken(token?: string) {
    if (!token) return "";
    if (token.length <= 8) return "••••••••";
    return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}

export async function GET() {
    try {
        const envContent = await readFile(envFilePath, "utf8").catch(() => "");

        const getEnvVal = (key: string) => {
            const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
            return match ? match[1].trim() : (process.env[key] || "");
        };

        const tiktokToken = getEnvVal("TIKTOK_ACCESS_TOKEN");
        const tiktokOpenId = getEnvVal("TIKTOK_OPEN_ID");
        const tiktokUsername = getEnvVal("TIKTOK_CREATOR_USERNAME");

        const igToken = getEnvVal("INSTAGRAM_ACCESS_TOKEN");
        const igAccountId = getEnvVal("INSTAGRAM_BUSINESS_ACCOUNT_ID");
        const igUsername = getEnvVal("INSTAGRAM_USERNAME");

        return NextResponse.json({
            ok: true,
            credentials: {
                tiktok: {
                    hasToken: Boolean(tiktokToken),
                    maskedToken: maskToken(tiktokToken),
                    openId: tiktokOpenId,
                    username: tiktokUsername,
                },
                instagram: {
                    hasToken: Boolean(igToken),
                    maskedToken: maskToken(igToken),
                    accountId: igAccountId,
                    username: igUsername,
                },
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao ler credenciais.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let envContent = await readFile(envFilePath, "utf8").catch(() => "");

        const updates: Record<string, string | undefined> = {
            TIKTOK_ACCESS_TOKEN: body.tiktokAccessToken?.trim(),
            TIKTOK_OPEN_ID: body.tiktokOpenId?.trim(),
            TIKTOK_CREATOR_USERNAME: body.tiktokUsername?.trim(),
            INSTAGRAM_ACCESS_TOKEN: body.instagramAccessToken?.trim(),
            INSTAGRAM_BUSINESS_ACCOUNT_ID: body.instagramAccountId?.trim(),
            INSTAGRAM_USERNAME: body.instagramUsername?.trim(),
        };

        for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined && val !== "") {
                const regex = new RegExp(`^${key}=.*$`, "m");
                if (regex.test(envContent)) {
                    envContent = envContent.replace(regex, `${key}=${val}`);
                } else {
                    envContent += `\n${key}=${val}`;
                }
                process.env[key] = val;
            }
        }

        await writeFile(envFilePath, envContent.trim() + "\n", "utf8");

        return NextResponse.json({
            ok: true,
            message: "Credenciais de API salvas com sucesso em .env.local!",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar credenciais.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
