import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    getNextOptimalSlot,
    schedulePost,
    cancelScheduledPost,
    cleanupPostFiles,
    processDuePosts,
    readScheduleQueue,
    clearScheduleQueue,
} from './post-scheduler.js';

// Protege a fila real: backup antes dos testes e restauração ao final
const QUEUE_FILE = path.join(process.cwd(), 'data', 'scheduled-posts.json');
let queueBackup = null;
test.before(() => {
    queueBackup = fs.existsSync(QUEUE_FILE) ? fs.readFileSync(QUEUE_FILE, 'utf8') : null;
});
test.after(() => {
    if (queueBackup !== null) fs.writeFileSync(QUEUE_FILE, queueBackup, 'utf8');
    else clearScheduleQueue();
});

test('getNextOptimalSlot returns upcoming time slot today or tomorrow', () => {
    const fixedNow = new Date('2026-10-13T10:00:00.000Z');
    const slot = getNextOptimalSlot(fixedNow);
    assert.ok(slot.scheduledFor);
    assert.ok(slot.timeString);
    assert.ok(slot.dayLabel);
    assert.ok(slot.reason.includes('Pico de audiência'));
});

test('schedulePost adds an entry to the schedule queue', () => {
    const post = schedulePost({
        title: 'CLUTCH 1V5 NO VALORANT',
        description: 'Melhor jogada do dia #valorant',
        useNextOptimal: true,
        deleteAfterPublish: true,
    });

    assert.ok(post.id.startsWith('sched_'));
    assert.equal(post.title, 'CLUTCH 1V5 NO VALORANT');
    assert.equal(post.status, 'SCHEDULED');
    assert.equal(post.deleteAfterPublish, true);

    const queue = readScheduleQueue();
    const found = queue.find((p) => p.id === post.id);
    assert.ok(found);
});

test('cancelScheduledPost marks post as cancelled', () => {
    const post = schedulePost({
        title: 'LINEUP DE SOVA',
        useNextOptimal: true,
    });

    const cancelled = cancelScheduledPost(post.id);
    assert.ok(cancelled);
    assert.equal(cancelled.status, 'CANCELLED');
});

test('cleanupPostFiles removes temporary video and subtitle files', () => {
    const testDir = path.join(process.cwd(), 'data', 'test-scratch');
    fs.mkdirSync(testDir, { recursive: true });

    const dummyVideo = path.join(testDir, 'sample-short.mp4');
    const dummySrt = `${dummyVideo}.srt`;
    const dummyAss = `${dummyVideo}.ass`;

    fs.writeFileSync(dummyVideo, 'dummy-video-data');
    fs.writeFileSync(dummySrt, 'dummy-srt-data');
    fs.writeFileSync(dummyAss, 'dummy-ass-data');

    assert.ok(fs.existsSync(dummyVideo));
    assert.ok(fs.existsSync(dummySrt));
    assert.ok(fs.existsSync(dummyAss));

    const deleted = cleanupPostFiles(dummyVideo);
    assert.equal(deleted.length, 3);
    assert.equal(fs.existsSync(dummyVideo), false);
    assert.equal(fs.existsSync(dummySrt), false);
    assert.equal(fs.existsSync(dummyAss), false);

    fs.rmdirSync(testDir);
});
