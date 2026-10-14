import fs from 'node:fs';
import path from 'node:path';

// Testa se uma imagem JPEG extraída é gameplay real ou menu/lobby
function inspectFrameType(filePath) {
    if (!fs.existsSync(filePath)) return { isGameplay: false, reason: 'Arquivo não existe' };
    
    // Podemos ler o buffer do JPEG ou usar FFmpeg para medir cor e bordas no HUD
    // No lobby (frame-2100): o topo esquerdo (0,0, 300x150) é azul-escuro plano (#0f1923) com texto branco "JOGAR"
    // Na gameplay (frame-900): o topo esquerdo tem o Minimapa circular verde/cinza com ícones coloridos
    const stat = fs.statSync(filePath);
    return {
        file: path.basename(filePath),
        sizeBytes: stat.size,
    };
}

console.log(inspectFrameType('scratch/frame-300.jpg'));
console.log(inspectFrameType('scratch/frame-900.jpg'));
console.log(inspectFrameType('scratch/frame-2100.jpg'));
