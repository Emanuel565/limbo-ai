import { NextResponse } from "next/server";
import { spawnSync } from "node:child_process";

export async function POST() {
    try {
        const result = spawnSync("node", ["--test", "tools/viral-short-pipeline.test.js"], {
            cwd: process.cwd(),
            encoding: "utf8",
        });

        const stdout = result.stdout?.trim() || "";
        const stderr = result.stderr?.trim() || "";

        if (result.error) {
            return NextResponse.json(
                { ok: false, error: result.error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            ok: result.status === 0,
            status: result.status ?? 1,
            stdout,
            stderr,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao executar os testes do pipeline.";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
