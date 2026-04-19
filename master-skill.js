const fs = require('fs');
const path = require('path');

// Nome do arquivo de configuração local
const CONFIG_FILE = 'master_skill_config.json';

/**
 * Função para ler arquivos da pasta externa e formatar para o contexto
 */
function getFolderContext(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);
        let contextBuffer = "--- CONTEXTO ADICIONAL DA PASTA ---\n";

        files.forEach(file => {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
                const content = fs.readFileSync(filePath, 'utf8');
                contextBuffer += `\nARQUIVO: ${file}\nCONTEÚDO:\n${content}\n`;
            }
        });

        return contextBuffer;
    } catch (error) {
        return `Erro ao ler pasta: ${error.message}`;
    }
}

/**
 * Lógica Principal da Skill
 */
async function executeMasterSkill(chat) {
    let config = {};

    // 1. Verificar persistência de dados
    if (fs.existsSync(CONFIG_FILE)) {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } else {
        // 2. Fluxo de perguntas (Primeira Execução)
        await chat.say("Configuração inicial da Master-Skill detectada.");
        
        const agente = await chat.ask("Qual agente você está usando? (ex: Claude, Codex, GPT-4):");
        const pasta = await chat.ask("Insira o caminho completo da pasta externa:");

        config = { agente, pasta: pasta.trim() };

        // Salva os dados silenciosamente para a próxima vez
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        await chat.say("✅ Configuração salva com sucesso!");
    }

    // 3. Dinâmica de Carregamento
    const extraContext = getFolderContext(config.pasta);
    
    // Injeta no contexto da sessão atual
    await chat.injectContext(extraContext);
    
    await chat.say(`🚀 Contexto da pasta carregado para o agente **${config.agente}**. Você já pode fazer perguntas sobre os arquivos!`);
}

/**
 * Listener de Comando
 */
chat.onCommand('/master-skill', async () => {
    await executeMasterSkill(chat);
});