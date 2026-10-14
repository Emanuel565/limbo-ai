import test from 'node:test';
import assert from 'node:assert/strict';
import {
    inspectGameplayFile,
    calculateOptimalCutsCount,
    findActiveGameplayWindows,
    inspectTimestampGameplayActive,
    auditCutWithLocalAI,
} from './gameplay-ai-analyzer.js';
import { schedulePost, updatePostApproval, clearScheduleQueue, readScheduleQueue } from './post-scheduler.js';

test('calculateOptimalCutsCount returns proper volume scaling for videos', () => {
    assert.equal(calculateOptimalCutsCount(10), 4);
    assert.equal(calculateOptimalCutsCount(30), 10);
    assert.equal(calculateOptimalCutsCount(128), 24);
});

test('inspectTimestampGameplayActive returns proper object structure', () => {
    const dummyPath = 'tools/viral-short-pipeline.js';
    const result = inspectTimestampGameplayActive(dummyPath, 10);
    assert.ok(typeof result.isGameplay === 'boolean');
    assert.ok(typeof result.isMenu === 'boolean');
});

test('auditCutWithLocalAI audits cuts and evaluates viral score', async () => {
    const dummyCut = {
        title: "ROUND 4: 1 HP E CONTRA 5 NO RETAKE DA B 💀",
        headline: "CLUTCH 1 HP NO SPIKE",
        hookText: "O time todo no chão e restava 1 segundo no relógio...",
        duration: 25,
        startSec: 900,
        roundNumber: 4,
        category: "Clutch Extremo",
    };

    const approval = await auditCutWithLocalAI({ cut: dummyCut, filePath: 'tools/viral-short-pipeline.js' });
    assert.ok(['APPROVED', 'REJECTED'].includes(approval.status));
    assert.ok(typeof approval.viralScore === 'number');
    assert.ok(approval.viralScore >= 0 && approval.viralScore <= 100);
    assert.ok(approval.checklist);
    assert.ok(typeof approval.verdict === 'string');
});

test('schedulePost and updatePostApproval store and mutate AI approval', () => {
    clearScheduleQueue();
    const scheduled = schedulePost({
        title: "TEST CLUTCH 1V5 NO VALORANT",
        description: "Teste de agendamento com selo de IA",
        videoUrl: "/generated/test-short.mp4",
        platforms: ["tiktok", "instagram"],
        aiApproval: {
            status: "APPROVED",
            viralScore: 95,
            verdict: "Aprovado: Excelente gancho e ritmo dinâmico.",
            checklist: { noLobbyOrScoreboard: true, hook3sPresent: true, combatPacing: true },
        },
    });

    assert.equal(scheduled.aiApproval.status, "APPROVED");
    assert.equal(scheduled.aiApproval.viralScore, 95);

    // Atualiza status via updatePostApproval
    const updated = updatePostApproval(scheduled.id, { status: "REJECTED", verdict: "Rejeitado para novos testes" });
    assert.equal(updated.aiApproval.status, "REJECTED");
    assert.equal(updated.aiApproval.manualOverride, true);

    const queue = readScheduleQueue();
    assert.equal(queue.length, 1);
    assert.equal(queue[0].aiApproval.status, "REJECTED");
    clearScheduleQueue();
});
