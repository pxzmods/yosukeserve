const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

//FUNCS - MENUS 
const { axios, path, fs, os, https, Banner, cron, FormData, API_KEY_BRONXYS, exec, execSync, fetchJson, formatUptime } = require('./consts-funcs.js');

//MENUS
const { menu, menuadm, menubn, menuDono, menuAlterador } = require('./consts-funcs.js');

let SocketActions = null; 

const { version: botVersion } = JSON.parse(fs.readFileSync(path.join('package.json')));

const config = JSON.parse(fs.readFileSync('./configure.json'));
const { numerodono, nomedono, nomebot, prefixo, debug, siteapi } = config;
const prefix = prefixo; 


const DATABASE_DIR = './dados/database';
const GRUPOS_DIR = './dados/database/grupos';
const USERS_DIR = './dados/database/users';
const DONO_DIR =  './dados/database/dono';


const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms));


const normalizar = (texto, keepCase = false) => {
  if (!texto || typeof texto !== 'string') return '';
  const normalizedText = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return keepCase ? normalizedText : normalizedText.toLowerCase();
};


function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    };
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error);
    return false;
  };
};


function ensureJsonFileExists(filePath, defaultContent = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      const dirPath = path.dirname(filePath);
      ensureDirectoryExists(dirPath);
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    };
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo JSON ${filePath}:`, error);
    return false;
  };
};


const loadJsonFile = (path, defaultValue = {}) => {
    try {
      return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : defaultValue;
    } catch (error) {
      console.error(`Erro ao carregar arquivo ${path}:`, error);
      return defaultValue;
    }
};


ensureDirectoryExists(GRUPOS_DIR);
ensureDirectoryExists(USERS_DIR);
ensureDirectoryExists(DONO_DIR);


ensureJsonFileExists(DATABASE_DIR + '/antiflood.json');
ensureJsonFileExists(DATABASE_DIR + '/cmdlimit.json');
ensureJsonFileExists(DATABASE_DIR + '/antipv.json');
ensureJsonFileExists(DONO_DIR + '/premium.json');
ensureJsonFileExists(DONO_DIR + '/bangp.json');
ensureJsonFileExists(DATABASE_DIR + '/globalBlocks.json', { commands: {}, users: {} });
ensureJsonFileExists(DATABASE_DIR + '/botState.json', { status: 'on' });


const SUBDONOS_FILE = path.join(DONO_DIR, '/subdonos.json');
ensureJsonFileExists(SUBDONOS_FILE, { subdonos: [] });


const loadSubdonos = () => {
  return loadJsonFile(SUBDONOS_FILE, { subdonos: [] }).subdonos || [];
};


const saveSubdonos = (subdonoList) => {
  try {
    ensureDirectoryExists(DONO_DIR); 
    fs.writeFileSync(SUBDONOS_FILE, JSON.stringify({ subdonos: subdonoList }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar subdonos:', error);
    return false;
  };
};

const isSubdono = (userId) => {
  const currentSubdonos = loadSubdonos(); 
  return currentSubdonos.includes(userId);
};


const addSubdono = (userId) => {
  if (!userId || typeof userId !== 'string' || !userId.includes('@s.whatsapp.net')) {
      return { success: false, message: 'ID de usuário inválido. Use o formato completo (ex: 1234567890@s.whatsapp.net) ou marque o usuário.' };
  };
  let currentSubdonos = loadSubdonos();
  if (currentSubdonos.includes(userId)) {
      return { success: false, message: '✨ Este usuário já é um subdono! Não precisa adicionar de novo. 😊' };
  };
  const nmrdn_check = numerodono.replace(/[^\d]/g, "") + '@s.whatsapp.net';
  if (userId === nmrdn_check) {
      return { success: false, message: '🤔 O Dono principal já tem todos os superpoderes! Não dá pra adicionar como subdono. 😉' };
  };
  currentSubdonos.push(userId);
  if (saveSubdonos(currentSubdonos)) {
    return { success: true, message: '🎉 Pronto! Novo subdono adicionado com sucesso! ✨' };
  } else {
    return { success: false, message: '😥 Oops! Tive um probleminha para salvar a lista de subdonos. Tente novamente, por favor!' };
  };
};


const removeSubdono = (userId) => {
  if (!userId || typeof userId !== 'string' || !userId.includes('@s.whatsapp.net')) {
      return { success: false, message: 'ID de usuário inválido. Use o formato completo (ex: 1234567890@s.whatsapp.net) ou marque o usuário.' };
  }
  let currentSubdonos = loadSubdonos();
  if (!currentSubdonos.includes(userId)) {
      return { success: false, message: '🤔 Este usuário não está na lista de subdonos.' };
  };
  const initialLength = currentSubdonos.length;
  currentSubdonos = currentSubdonos.filter(id => id !== userId);
  if (currentSubdonos.length === initialLength) {
      return { success: false, message: 'Usuário não encontrado na lista (erro inesperado). 🤷' };
  };
  if (saveSubdonos(currentSubdonos)) {
    return { success: true, message: '👋 Pronto! Subdono removido com sucesso! ✨' };
  } else {
    return { success: false, message: '😥 Oops! Tive um probleminha para salvar a lista após remover o subdono. Tente novamente!' };
  };
};


const getSubdonos = () => {
  return [...loadSubdonos()];
};


const ALUGUEIS_FILE = path.join('./dados/database/dono/alugueis.json');
const CODIGOS_ALUGUEL_FILE = path.join(DONO_DIR, 'codigos_aluguel.json');


ensureJsonFileExists(ALUGUEIS_FILE, { globalMode: false, groups: {} });
ensureJsonFileExists(CODIGOS_ALUGUEL_FILE, { codes: {} });


const loadRentalData = () => {
  return loadJsonFile(ALUGUEIS_FILE, { globalMode: false, groups: {} });
};


const saveRentalData = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(ALUGUEIS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de aluguel:', error);
    return false;
  }
};


const isRentalModeActive = () => {
  const rentalData = loadRentalData();
  return rentalData.globalMode === true;
};


const setRentalMode = (isActive) => {
  let rentalData = loadRentalData();
  rentalData.globalMode = !!isActive;
  return saveRentalData(rentalData);
};


const getGroupRentalStatus = (groupId) => {
  const rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) {
    return { active: false, expiresAt: null, permanent: false };
  }
  if (groupInfo.expiresAt === 'permanent') {
    return { active: true, expiresAt: 'permanent', permanent: true };
  }
  if (groupInfo.expiresAt) {
    const expirationDate = new Date(groupInfo.expiresAt);
    if (expirationDate > new Date()) {
      return { active: true, expiresAt: groupInfo.expiresAt, permanent: false };
    } else {
      return { active: false, expiresAt: groupInfo.expiresAt, permanent: false };
    }
  }
  return { active: false, expiresAt: null, permanent: false };
};


const setGroupRental = (groupId, durationDays) => {
  if (!groupId || typeof groupId !== 'string' || !groupId.endsWith('@g.us')) {
    return { success: false, message: '🤔 ID de grupo inválido! Verifique se o ID está correto (geralmente termina com @g.us).' };
  }
  let rentalData = loadRentalData();
  let expiresAt = null;
  let message = '';
  if (durationDays === 'permanent') {
    expiresAt = 'permanent';
    message = `✅ Aluguel permanente ativado!`;
  } else if (typeof durationDays === 'number' && durationDays > 0) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);
    expiresAt = expirationDate.toISOString();
    message = `✅ Aluguel ativado por ${durationDays} dias! Expira em: ${expirationDate.toLocaleDateString('pt-BR')}.`;
  } else {
    return { success: false, message: '🤔 Duração inválida! Use um número de dias (ex: 30) ou a palavra "permanente".' };
  }
  rentalData.groups[groupId] = { expiresAt };
  if (saveRentalData(rentalData)) {
    return { success: true, message: message };
  } else {
    return { success: false, message: '😥 Oops! Tive um problema ao salvar as informações de aluguel deste grupo.' };
  }
};


const loadActivationCodes = () => {
  return loadJsonFile(CODIGOS_ALUGUEL_FILE, { codes: {} });
};


const saveActivationCodes = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(CODIGOS_ALUGUEL_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar códigos de ativação:', error);
    return false;
  }
};


const generateActivationCode = (durationDays, targetGroupId = null) => {
  const crypto = require('crypto');
  let code = '';
  let codesData = loadActivationCodes();
  do {
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
  } while (codesData.codes[code]);
  if (durationDays !== 'permanent' && (typeof durationDays !== 'number' || durationDays <= 0)) {
      return { success: false, message: '🤔 Duração inválida para o código! Use um número de dias (ex: 7) ou "permanente".' };
  }
  if (targetGroupId && (typeof targetGroupId !== 'string' || !targetGroupId.endsWith('@g.us'))) {
      targetGroupId = null;
  }
  codesData.codes[code] = {
    duration: durationDays,
    targetGroup: targetGroupId,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString()
  };
  if (saveActivationCodes(codesData)) {
    let message = `🔑 Código de ativação gerado:\n\n*${code}*\n\n`;
    if (durationDays === 'permanent') {
        message += `Duração: Permanente ✨\n`;
    } else {
        message += `Duração: ${durationDays} dias ⏳\n`;
    }
    if (targetGroupId) {
        message += `Grupo Alvo: ${targetGroupId} 🎯\n`;
    }
    message += `\nEnvie este código no grupo para ativar o aluguel.`;
    return { success: true, message: message, code: code };
  } else {
    return { success: false, message: '😥 Oops! Não consegui salvar o novo código de ativação. Tente gerar novamente!' };
  }
};


const validateActivationCode = (code) => {
  const codesData = loadActivationCodes();
  const codeInfo = codesData.codes[code?.toUpperCase()];

  if (!codeInfo) {
    return { valid: false, message: '🤷 Código de ativação inválido ou não encontrado!' };
  }
  if (codeInfo.used) {
    return { valid: false, message: `😕 Este código já foi usado em ${new Date(codeInfo.usedAt).toLocaleDateString('pt-BR')} por ${codeInfo.usedBy?.split('@')[0] || 'alguém'}!` };
  }
  return { valid: true, ...codeInfo };
};


const useActivationCode = (code, groupId, userId) => {
  const validation = validateActivationCode(code);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }
  const codeInfo = validation;
  code = code.toUpperCase();
  if (codeInfo.targetGroup && codeInfo.targetGroup !== groupId) {
    return { success: false, message: '🔒 Este código de ativação é específico para outro grupo!' };
  };
  const rentalResult = setGroupRental(groupId, codeInfo.duration);
  if (!rentalResult.success) {
    return { success: false, message: `😥 Oops! Erro ao ativar o aluguel com este código: ${rentalResult.message}` };
  }
  let codesData = loadActivationCodes();
  codesData.codes[code].used = true;
  codesData.codes[code].usedBy = userId;
  codesData.codes[code].usedAt = new Date().toISOString();
  codesData.codes[code].activatedGroup = groupId;
  if (saveActivationCodes(codesData)) {
    return { success: true, message: `🎉 Código *${code}* ativado com sucesso! ${rentalResult.message}` };
  } else {
    console.error(`Falha CRÍTICA ao marcar código ${code} como usado após ativar aluguel para ${groupId}.`);
    return { success: false, message: '🚨 Erro Crítico! O aluguel foi ativado, mas não consegui marcar o código como usado. Por favor, contate o suporte informando o código!' };
  }
};


const isModoLiteActive = (groupData, modoLiteGlobalConfig) => {
  const isModoLiteGlobal = modoLiteGlobalConfig?.status || false;
  const isModoLiteGrupo = groupData?.modolite || false;
  const groupHasSetting = groupData && typeof groupData.modolite === 'boolean';
  if (groupHasSetting) {
      return groupData.modolite; 
  }
  return isModoLiteGlobal;
};


async function NazuninhaBotExec(nazu, info, store, groupCache) {
  SocketActions = nazu;
  
  const { youtube, tiktok, pinterest, igdl, sendSticker, FilmesDL, styleText, emojiMix, upload, mcPlugin, tictactoe, toolsJson, vabJson, apkMod, google, Lyrics, commandStats, ia } = await require('./dados/src/funcs/exports.js');
    
  const antipvData = loadJsonFile(DATABASE_DIR + '/antipv.json');
  const premiumListaZinha = loadJsonFile(DONO_DIR + '/premium.json');
  const banGpIds = loadJsonFile('./dados/database/dono/bangp.json');
  const antifloodData = loadJsonFile('./dados/database/antiflood.json');
  const cmdLimitData = loadJsonFile('./dados/database/cmdlimit.json');
  const globalBlocks = loadJsonFile('./dados/database/globalBlocks.json', { commands: {}, users: {} });
  const botState = loadJsonFile('./dados/database/botState.json', { status: 'on' });
  
  const modoLiteFile = './dados/database/modolite.json';
  let modoLiteGlobal = loadJsonFile(modoLiteFile, { status: false });
  
  if (!fs.existsSync(modoLiteFile)) {
    fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
  };

  global.autoStickerMode = global.autoStickerMode || 'default';

  try {
    const from = info.key.remoteJid;
    const isGroup = from?.endsWith('@g.us') || false;
    if(!info.key.participant && !info.key.remoteJid) return;  
    const sender = isGroup ? (info.key.participant?.includes(':') ? info.key.participant.split(':')[0] + '@s.whatsapp.net' : info.key.participant) : info.key.remoteJid;
    const pushname = info.pushName || '';
    const isStatus = from?.endsWith('@broadcast') || false;  
    const nmrdn = numerodono.replace(/[^\d]/g, "") + '@s.whatsapp.net';  
    const subDonoList = loadSubdonos();
    const isSubOwner = isSubdono(sender);
    const isOwner = (nmrdn === sender) || info.key.fromMe || isSubOwner;
    const isOwnerOrSub = isOwner || isSubOwner;
 
    const WaLib = require('@cognima/walib');
    const type = WaLib.getContentType(info.message);
 
    const isMedia = ["imageMessage", "videoMessage", "audioMessage"].includes(type);
    const isImage = type === 'imageMessage';
    const isVideo = type === 'videoMessage';
    const isVisuU2 = type === 'viewOnceMessageV2';
    const isVisuU = type === 'viewOnceMessage';
 
    const getMessageText = (message) => {
      if (!message) return '';
      return message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || message.videoMessage?.caption || message.documentWithCaptionMessage?.message?.documentMessage?.caption || message.viewOnceMessage?.message?.imageMessage?.caption || message.viewOnceMessage?.message?.videoMessage?.caption || message.viewOnceMessageV2?.message?.imageMessage?.caption || message.viewOnceMessageV2?.message?.videoMessage?.caption || message.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || message.editedMessage?.message?.protocolMessage?.editedMessage?.imageMessage?.caption || '';
    };

    const body = getMessageText(info.message) || info?.text || '';
    
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const budy2 = normalizar(body);
 
    if(!budy2 || budy2.length < 1) return;
 
    const menc_prt = info.message?.extendedTextMessage?.contextInfo?.participant;
    const menc_jid = args.join(" ").replace("@", "") + "@s.whatsapp.net";
    const menc_jid2 = info.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const menc_os2 = q.includes("@") ? menc_jid : menc_prt;
    const sender_ou_n = q.includes("@") ? menc_jid : (menc_prt || sender);

    const isCmd = body.trim().startsWith(prefix);
    const command = isCmd ? budy2.trim().slice(1).split(/ +/).shift().trim().replace(/\s+/g, '') : null;
 
    if (!isGroup) {
      if (antipvData.mode === 'antipv' && !isOwner) {
        return;
      };
      if (antipvData.mode === 'antipv2' && isCmd && !isOwner) {
        await reply('🚫 Este comando só funciona em grupos!');
        return;
      };
      if (antipvData.mode === 'antipv3' && isCmd && !isOwner) {
        await nazu.updateBlockStatus(sender, 'block');
        await reply('🚫 Você foi bloqueado por usar comandos no privado!');
        return;
      };
    };

    const isPremium = premiumListaZinha[sender] || premiumListaZinha[from] || isOwner;
 
    if (isGroup && banGpIds[from] && !isOwner && !isPremium) {
      return;
    };
 
 const groupMetadata = !isGroup ? {} : await nazu.groupMetadata(from).catch(() => ({}));
const groupName = groupMetadata?.subject || '';
const AllgroupMembers = !isGroup ? [] : groupMetadata.participants?.map(p => p.id) || [];
// Linha 471
const groupAdmins = isGroup ? groupMetadata.participants.filter(p => p.admin).map(p => p.id) : [];

// --- Adição de LID aqui ---
let groupMembersWithLID = []; // Inicializa como array vazio

if (isGroup && groupMetadata.participants) {
  // Filtra os participantes que possuem a propriedade 'lid' ou 'isGroupWithLid'
  // Nota: A propriedade 'lid' pode variar dependendo de como o Baileys expõe essa informação.
  // Se 'isGroupWithLid' já é uma flag geral do grupo, talvez precise de uma propriedade no participante.
  groupMembersWithLID = groupMetadata.participants
    .filter(p => p.lid) // Assume que 'p.lid' existe para participantes com LID
    .map(p => p.id);
}
// --- Fim da adição ---

const groupFile = path.join('dados', 'database', 'grupos', `${from}.json`);
let groupData = {};
if (isGroup) {
  if (!fs.existsSync(groupFile)) {
    fs.writeFileSync(groupFile, JSON.stringify({
      mark: {},
      createdAt: new Date().toISOString(),
      groupName: groupName,
      // Adiciona a lista de membros com LID ao novo grupo
      membersWithLID: groupMembersWithLID
    }, null, 2));
  };

  try {
    groupData = JSON.parse(fs.readFileSync(groupFile));
  } catch (error) {
    console.error(`Erro ao carregar dados do grupo ${from}:`, error);
    groupData = { mark: {} };
  };

  groupData.moderators = groupData.moderators || [];
  groupData.allowedModCommands = groupData.allowedModCommands || [];
  groupData.mutedUsers = groupData.mutedUsers || {};

  // Atualiza o nome do grupo e a lista de membros com LID se houver mudanças
  if (groupName && groupData.groupName !== groupName) {
    groupData.groupName = groupName;
  }
  // Atualiza a lista de membros com LID se ela mudar
  // Você pode adicionar uma verificação mais robusta se a ordem ou membros forem importantes
  if (JSON.stringify(groupData.membersWithLID) !== JSON.stringify(groupMembersWithLID)) {
    groupData.membersWithLID = groupMembersWithLID;
  }
  fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
};

// ... (restante do seu código)

    
    
// Move the definition of botNumber here, before it's used
const botNumber = nazu.user.id.split(':')[0] + '@s.whatsapp.net';
const isBotAdmin = !isGroup ? false : groupAdmins.includes(botNumber);
  
  
    let isGroupAdmin = false;
    if (isGroup) {
      const isModeratorActionAllowed = groupData.moderators?.includes(sender) && groupData.allowedModCommands?.includes(command);
      isGroupAdmin = groupAdmins.includes(sender) || isOwner || isModeratorActionAllowed;
    };
  
    const isModoBn = groupData.modobrincadeira;
    const isOnlyAdmin = groupData.soadm;
    const isAntiPorn = groupData.antiporn;
    const isMuted = groupData.mutedUsers?.[sender];
    const isAntiLinkGp = groupData.antilinkgp;
    const isModoLite = isGroup && isModoLiteActive(groupData, modoLiteGlobal);
  
    if (isGroup && isOnlyAdmin && !isGroupAdmin) {
      return;
    };
  
    if (isGroup && isCmd && !isGroupAdmin && 
      groupData.blockedCommands && groupData.blockedCommands[command]) {
      await reply('⛔ Este comando foi bloqueado pelos administradores do grupo.');
      return;
    };
  
    if (isGroup && groupData.afkUsers && groupData.afkUsers[sender]) {
      try {
        const afkReason = groupData.afkUsers[sender].reason;
        const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR');
        delete groupData.afkUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${afkSince}`);
      } catch (error) {
        console.error("Erro ao processar remoção de AFK:", error);
      };
    };

    if (isGroup && isMuted) {
      try {
        await nazu.sendMessage(from, { text: `🤫 *Usuário mutado detectado*\n\n@${sender.split("@")[0]}, você está tentando falar enquanto está mutado neste grupo. Você será removido conforme as regras.`, mentions: [sender] }, {quoted: info});
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }});      
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
        } else {
          await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
        };
        delete groupData.mutedUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        return;
      } catch (error) {
        console.error("Erro ao processar usuário mutado:", error);
      };
    };
 
    const rentalModeOn = isRentalModeActive();
    let groupHasActiveRental = false;
    let rentalStatusChecked = false;

    if (isGroup && rentalModeOn) {
      const rentalStatus = getGroupRentalStatus(from);
      groupHasActiveRental = rentalStatus.active;
      rentalStatusChecked = true;
    
      const allowedCommandsBypass = ['modoaluguel', 'addaluguel', 'gerarcodigo', 'addsubdono', 'remsubdono', 'listasubdonos'];

      if (!groupHasActiveRental && isCmd && !isOwnerOrSub && !allowedCommandsBypass.includes(command)) {
        await reply("⏳ Oops! Parece que o aluguel deste grupo expirou ou não está ativo. Para usar os comandos, ative com um código ou peça para o dono renovar! 😊");
        return;
      };
    };

    if (isGroup && !isCmd && body && /\b[A-F0-9]{8}\b/.test(body.toUpperCase())) {
      const potentialCode = body.match(/\b[A-F0-9]{8}\b/)[0].toUpperCase();
      const validation = validateActivationCode(potentialCode);
      if (validation.valid) {
        try {
          const activationResult = useActivationCode(potentialCode, from, sender);
          await reply(activationResult.message);
          if (activationResult.success) {
            return;
          };
        } catch (e) {
          console.error(`Erro ao tentar usar código de ativação ${potentialCode} no grupo ${from}:`, e);
        };
      };
    };

    if (isGroup) {
      try {
        groupData.contador = groupData.contador || [];
     
        const userIndex = groupData.contador.findIndex(user => user.id === sender);
     
        if (userIndex !== -1) {
          const userData = groupData.contador[userIndex];       
          if (isCmd) {
            userData.cmd = (userData.cmd || 0) + 1;
          } else if (type === "stickerMessage") {
            userData.figu = (userData.figu || 0) + 1;
          } else {
            userData.msg = (userData.msg || 0) + 1;
          };       
          if (pushname && userData.pushname !== pushname) {
            userData.pushname = pushname;
          };
          userData.lastActivity = new Date().toISOString();
        } else {
          groupData.contador.push({ id: sender, msg: isCmd ? 0 : 1, cmd: isCmd ? 1 : 0, figu: type === "stickerMessage" ? 1 : 0, pushname: pushname || 'Usuário Desconhecido', firstSeen: new Date().toISOString(), lastActivity: new Date().toISOString()});
        };
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      } catch (error) {
        console.error("Erro no sistema de contagem de mensagens:", error);
      };
    };
 
    async function reply(text, options = {}) {
      try {
        const { 
          mentions = [], 
          noForward = false, 
          noQuote = false,
          buttons = null
        } = options;
     
        const messageContent = {
          text: text.trim(),
          mentions: mentions
        };
     
        if (buttons) {
          messageContent.buttons = buttons;
          messageContent.headerType = 1;
        }
     
        const sendOptions = {
          sendEphemeral: true
        };
     
        if (!noForward) {
          sendOptions.contextInfo = { 
            forwardingScore: 50, 
            isForwarded: true, 
            externalAdReply: { 
              showAdAttribution: true 
            }
          };
        }
     
        if (!noQuote) {
          sendOptions.quoted = info;
        }
     
        const result = await nazu.sendMessage(from, messageContent, sendOptions);
        return result;
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return null;
      }
    }
    
    nazu.reply = reply;
 
    const reagir = async (emj, options = {}) => {
      try {
        const messageKey = options.key || info.key;
        const delay = options.delay || 500;
     
        if (!messageKey) {
          console.error("Chave de mensagem inválida para reação");
          return false;
        }
     
        if (typeof emj === 'string') {
          if (emj.length < 1 || emj.length > 5) {
            console.warn("Emoji inválido para reação:", emj);
            return false;
          }
       
          await nazu.sendMessage(from, { 
            react: { 
              text: emj, 
              key: messageKey 
            } 
          });
       
          return true;
        } else if (Array.isArray(emj) && emj.length > 0) {
          for (const emoji of emj) {
            if (typeof emoji !== 'string' || emoji.length < 1 || emoji.length > 5) {
              console.warn("Emoji inválido na sequência:", emoji);
              continue;
            }
         
            await nazu.sendMessage(from, { 
              react: { 
                text: emoji, 
                key: messageKey 
              } 
            });
         
            if (delay > 0 && emj.indexOf(emoji) < emj.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
       
          return true;
        }
     
        return false;
      } catch (error) {
        console.error("Erro ao reagir com emoji:", error);
        return false;
      }
    };
    
    nazu.react = reagir;
 
 
    const getFileBuffer = async (mediakey, mediaType, options = {}) => {
      try {
        if (!mediakey) {
          throw new Error('Chave de mídia inválida');
        }     
        const stream = await downloadContentFromMessage(mediakey, mediaType);     
        let buffer = Buffer.from([]);    
        const MAX_BUFFER_SIZE = 50 * 1024 * 1024;
        let totalSize = 0;
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
          totalSize += chunk.length;       
          if (totalSize > MAX_BUFFER_SIZE) {
            throw new Error(`Tamanho máximo de buffer excedido (${MAX_BUFFER_SIZE / (1024 * 1024)}MB)`);
          }
        }
     
        if (options.saveToTemp) {
          try {
            const tempDir = path.join(__dirname, '..', 'database', 'tmp');
            ensureDirectoryExists(tempDir);
            const fileName = options.fileName || `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            const extensionMap = {
              image: '.jpg',
              video: '.mp4',
              audio: '.mp3',
              document: '.bin'
            };
      
            const extension = extensionMap[mediaType] || '.dat';
         
            const filePath = path.join(tempDir, fileName + extension);
         
            fs.writeFileSync(filePath, buffer);
         
            return filePath;
          } catch (fileError) {
            console.error('Erro ao salvar arquivo temporário:', fileError);
          }
        }
     
        return buffer;
      } catch (error) {
        console.error(`Erro ao obter buffer de ${mediaType}:`, error);
        throw error;
      }
    }


    const getMediaInfo = (message) => {
      if (!message) return null;
      if (message.imageMessage) return { media: message.imageMessage, type: 'image' };
      if (message.videoMessage) return { media: message.videoMessage, type: 'video' };
      if (message.viewOnceMessage?.message?.imageMessage) return { media: message.viewOnceMessage.message.imageMessage, type: 'image' };
      if (message.viewOnceMessage?.message?.videoMessage) return { media: message.viewOnceMessage.message.videoMessage, type: 'video' };
      if (message.viewOnceMessageV2?.message?.imageMessage) return { media: message.viewOnceMessageV2.message.imageMessage, type: 'image' };
      if (message.viewOnceMessageV2?.message?.videoMessage) return { media: message.viewOnceMessageV2.message.videoMessage, type: 'video' };
      return null;
    };


    if (isGroup && info.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentioned = info.message.extendedTextMessage.contextInfo.mentionedJid;
      if (groupData.afkUsers) {
        for (const jid of mentioned) {
          if (groupData.afkUsers[jid]) {
            const afkData = groupData.afkUsers[jid];
            const afkSince = new Date(afkData.since).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            let afkMsg = `😴 @${jid.split('@')[0]} está AFK desde ${afkSince}.`;
            if (afkData.reason) {
              afkMsg += `\nMotivo: ${afkData.reason}`;
            }
            await reply(afkMsg, { mentions: [jid] });
          }
        }
      }
    }


    if (isGroup && isAntiPorn) {
      const mediaInfo = getMediaInfo(info.message);
      if (mediaInfo && mediaInfo.type === 'image') {
        try {
          const imageBuffer = await getFileBuffer(mediaInfo.media, 'image');
          const mediaURL = await upload(imageBuffer, true);
          if (mediaURL) {
            const apiResponse = await axios.get(`https://nsfw-demo.sashido.io/api/image/classify?url=${encodeURIComponent(mediaURL)}`);
            let scores = { Porn: 0, Hentai: 0 };
            if (Array.isArray(apiResponse.data)) {
              scores = apiResponse.data.reduce((acc, item) => {
                if (item && typeof item.className === 'string' && typeof item.probability === 'number') {
                  if (item.className === 'Porn' || item.className === 'Hentai') {
                    acc[item.className] = Math.max(acc[item.className] || 0, item.probability);
                  }
                }
                return acc;
              }, { Porn: 0, Hentai: 0 });
            } else {
              console.warn("Anti-porn API response format unexpected:", apiResponse.data);
            };
            const pornThreshold = 0.7;
            const hentaiThreshold = 0.7;
            const isPorn = scores.Porn >= pornThreshold;
            const isHentai = scores.Hentai >= hentaiThreshold;
            if (isPorn || isHentai) {
              const reason = isPorn ? 'Pornografia' : 'Hentai';
              await reply(`🚨 Conteúdo impróprio detectado! (${reason})`);
              if (isBotAdmin) {
                try {
                  await nazu.sendMessage(from, { delete: info.key });
                  await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                  await reply(`🔞 Oops! @${sender.split('@')[0]}, conteúdo impróprio não é permitido e você foi removido(a).`,  { mentions: [sender] });
                } catch (adminError) {
                  console.error(`Erro ao remover usuário por anti-porn: ${adminError}`);
                  await reply(`⚠️ Não consegui remover @${sender.split('@')[0]} automaticamente após detectar conteúdo impróprio. Admins, por favor, verifiquem!`,  { mentions: [sender] });
                };
              } else {
                await reply(`@${sender.split('@')[0]} enviou conteúdo impróprio (${reason}), mas não posso removê-lo sem ser admin.`, { mentions: [sender] });
              }
            }
          } else {
             console.warn("Falha no upload da imagem para verificação anti-porn.");
          }
        } catch (error) {
          console.error("Erro na verificação anti-porn:", error);
        };
      };
    };


    if (isGroup && groupData.antiloc && !isGroupAdmin && type === 'locationMessage') {
      await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
      await nazu.groupParticipantsUpdate(from, [sender], 'remove');
      await reply(`🗺️ Ops! @${sender.split('@')[0]}, parece que localizações não são permitidas aqui e você foi removido(a).`,  { mentions: [sender] });
    };


    if (isGroup && antifloodData[from]?.enabled && isCmd && !isGroupAdmin) {
      antifloodData[from].users = antifloodData[from].users || {};
      const now = Date.now();
      const lastCmd = antifloodData[from].users[sender]?.lastCmd || 0;
      const interval = antifloodData[from].interval * 1000;
      if (now - lastCmd < interval) {
        return reply(`⏳ Calma aí, apressadinho(a)! 😊 Espere ${Math.ceil((interval - (now - lastCmd)) / 1000)} segundos para usar outro comando, por favor! ✨`);
      };
      antifloodData[from].users[sender] = { lastCmd: now };
      fs.writeFileSync('./dados/database/antiflood.json', JSON.stringify(antifloodData, null, 2));
    };


    if (isGroup && groupData.antidoc && !isGroupAdmin && (type === 'documentMessage' || type === 'documentWithCaptionMessage')) {
      await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
      await nazu.groupParticipantsUpdate(from, [sender], 'remove');
      await reply(`📄 Oops! @${sender.split('@')[0]}, parece que documentos não são permitidos aqui e você foi removido(a).`,  { mentions: [sender] });
    };


    if (isGroup && cmdLimitData[from]?.enabled && isCmd && !isGroupAdmin) {
      cmdLimitData[from].users = cmdLimitData[from].users || {};
      const today = new Date().toISOString().split('T')[0];
      cmdLimitData[from].users[sender] = cmdLimitData[from].users[sender] || { date: today, count: 0 };
      if (cmdLimitData[from].users[sender].date !== today) {
        cmdLimitData[from].users[sender] = { date: today, count: 0 };
      }
      if (cmdLimitData[from].users[sender].count >= cmdLimitData[from].limit) {
        return reply(`🚫 Oops! Você já usou seus ${cmdLimitData[from].limit} comandos de hoje. Tente novamente amanhã! 😊`);
      }
      cmdLimitData[from].users[sender].count++;
      fs.writeFileSync('./dados/database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
    };


    if (isGroup && groupData.autodl && budy2.includes('http') && !isCmd) {
      const urlMatch = body.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch) {
        for (const url of urlMatch) {
          try {
            if (url.includes('tiktok.com')) {
              const datinha = await tiktok.dl(url);
              if (datinha.ok) {
                await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }, caption: '🎵 Download automático do TikTok!' }, { quoted: info });
              }
            } else if (url.includes('instagram.com')) {
              const datinha = await igdl.dl(url);
              if (datinha.ok) {
                await nazu.sendMessage(from, { [datinha.data[0].type]: datinha.data[0].buff, caption: '📸 Download automático do Instagram!' }, { quoted: info });
              }
            } else if (url.includes('pinterest.com') || url.includes('pin.it') ) {
              const datinha = await pinterest.dl(url);
              if (datinha.ok) {
                await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }, caption: '📌 Download automático do Pinterest!' }, { quoted: info });
              }
            }
          } catch (e) {
            console.error('Erro no autodl:', e);
          }
        }
      }
    }


    if (isGroup && groupData.autoSticker && !info.key.fromMe) {
      try {
        const mediaImage = info.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage;                      
        const mediaVideo = info.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage;     
        if (mediaImage || mediaVideo) {
          const isVideo = !!mediaVideo;     
          if (isVideo && mediaVideo.seconds > 9.9) {
            return;
          }       
          const buffer = await getFileBuffer(
            isVideo ? mediaVideo : mediaImage, 
            isVideo ? 'video' : 'image'
          );
          const shouldForceSquare = global.autoStickerMode === 'square';
       
          await sendSticker(nazu, from, { sticker: buffer, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: isVideo ? 'video' : 'image', forceSquare: shouldForceSquare }, { quoted: info });
        }
      } catch (e) {
        console.error("Erro ao converter mídia em figurinha automática:", e);
      }
    };


    if (isGroup && groupData.antilinkhard && !isGroupAdmin && budy2.includes('http') && !isOwner) {
      try {
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }});
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🔗 Ops! @${sender.split('@')[0]}, links não são permitidos aqui e você foi removido(a).`,  { mentions: [sender] });
        } else {
          await reply(`🔗 Atenção, @${sender.split('@')[0]}! Links não são permitidos aqui. Não consigo remover você, mas por favor, evite enviar links. 😉`,  { mentions: [sender] });
        };     
        return;
      } catch (error) {
        console.error("Erro no sistema antilink hard:", error);
      };
    };


    let quotedMessageContent = null;
    if (type === 'extendedTextMessage' && info.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      quotedMessageContent = info.message.extendedTextMessage.contextInfo.quotedMessage;
    }
 
    const isQuotedMsg = !!quotedMessageContent?.conversation;
    const isQuotedMsg2 = !!quotedMessageContent?.extendedTextMessage?.text;
    const isQuotedImage = !!quotedMessageContent?.imageMessage;
    const isQuotedVisuU = !!quotedMessageContent?.viewOnceMessage;
    const isQuotedVisuU2 = !!quotedMessageContent?.viewOnceMessageV2;
    const isQuotedVideo = !!quotedMessageContent?.videoMessage;
    const isQuotedDocument = !!quotedMessageContent?.documentMessage;
    const isQuotedDocW = !!quotedMessageContent?.documentWithCaptionMessage;
    const isQuotedAudio = !!quotedMessageContent?.audioMessage;
    const isQuotedSticker = !!quotedMessageContent?.stickerMessage;
    const isQuotedContact = !!quotedMessageContent?.contactMessage;
    const isQuotedLocation = !!quotedMessageContent?.locationMessage;
    const isQuotedProduct = !!quotedMessageContent?.productMessage;
 
 
    if (body.startsWith('$')) {
      if (!isOwner) return;
      try {
        exec(q, (err, stdout) => {
          if (err) {
            return reply(`❌ *Erro na execução*\n\n${err}`);
          };
          if (stdout) {
            reply(`✅ *Resultado do comando*\n\n${stdout}`);
          };
      });
      } catch (error) {
        reply(`❌ *Erro ao executar comando*\n\n${error}`);
      };
    };
 

    if (body.startsWith('>>')) {
      if (!isOwner) return;
      try {
        (async () => {
          try {
            const codeLines = body.slice(2).trim().split('\n');
            if (codeLines.length > 1) {
              if (!codeLines[codeLines.length - 1].includes('return')) {
                codeLines[codeLines.length - 1] = 'return ' + codeLines[codeLines.length - 1];
              };
            } else {
              if (!codeLines[0].includes('return')) {
                codeLines[0] = 'return ' + codeLines[0];
              };
            };
            const result = await eval(`(async () => { ${codeLines.join('\n')} })()`);
            let output;
            if (typeof result === 'object' && result !== null) {
              output = JSON.stringify(result, null, 2);
            } else if (typeof result === 'function') {
              output = result.toString();
            } else {
              output = String(result);
            };
            return reply(`✅ *Resultado da execução*\n\n${output}`).catch(e => reply(String(e)));
          } catch (e) {
            return reply(`❌ *Erro na execução*\n\n${String(e)}`);
          }
        })();
      } catch (e) {
        reply(`❌ *Erro crítico*\n\n${String(e)}`);
      };
    };
 

    if (isGroup && isAntiLinkGp && !isGroupAdmin && budy2.includes('chat.whatsapp.com')) {
      try {
        if (isOwner) return;
        const link_dgp = await nazu.groupInviteCode(from);
        if (budy2.includes(link_dgp)) return;
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }});
        if (!AllgroupMembers.includes(sender)) return;
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🔗 Ops! @${sender.split('@')[0]}, links de outros grupos não são permitidos aqui e você foi removido(a).`,  { mentions: [sender] });
        } else {
          await reply(`🔗 Atenção, @${sender.split('@')[0]}! Links de outros grupos não são permitidos. Não consigo remover você, mas por favor, evite compartilhar esses links. 😉`,  { mentions: [sender] });
        }     
        return;
      } catch (error) {
        console.error("Erro no sistema antilink de grupos:", error);
      }
    };
 

    const botStateFile = './dados/database/botState.json';
    if (botState.status === 'off' && !isOwner) return;


//==================================\\
/*CONSOLE TERMUX*/
//==================================\\

const colors = {

  reset: '\x1b[0m',

  green: '\x1b[1;32m',
  red: '\x1b[1;31m',
  blue: '\x1b[1;34m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[1;36m',
  magenta: '\x1b[1;35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};


    try {
console.log(`\n${colors.green}=========================================`);
      console.log(`[ ${isCmd ? 'Comando' : 'Mensagem'} ${isGroup ? 'em grupo' : 'no privado'} ]\n`);
      const messagePreview = isCmd ? `${prefix}${command} ${q.length > 0 ? q.substring(0, 20) + (q.length > 20 ? '...' : '') : ''}` : budy2.substring(0, 30) + (budy2.length > 30 ? '...' : '');
      console.log(`${colors.cyan}${isCmd ? 'Comando' : 'Mensagem'}: "${messagePreview}"\n`);
      if (isGroup) {
        console.log(`${colors.yellow}Grupo: "${groupName || 'Desconhecido'}"\n`);
        console.log(`${colors.red}Usuário: "${pushname || 'Sem Nome'}"\n`);
      } else {
        console.log(`👤 Usuário: "${pushname || 'Sem nome'}"\n`);
        console.log(`📲 Número: "${sender.split('@')[0]}"\n`);
      };
      console.log(`${colors.blue}Horario: ${new Date().toLocaleTimeString('pt-BR')}`);
      console.log(`${colors.green}=========================================\n`);
    } catch (error) {
      console.error("Erro ao gerar logs:", error);
    };


    if (isGroup) {
      try {
        if (tictactoe.hasPendingInvitation(from) && budy2) {
          const normalizedResponse = budy2.toLowerCase().trim();
          const result = tictactoe.processInvitationResponse(from, sender, normalizedResponse);
          if (result.success) {
            await nazu.sendMessage(from, { text: result.message, mentions: result.mentions || [] });
          }
        };
        
        if (tictactoe.hasActiveGame(from) && budy2) {
          if (['tttend', 'rv', 'fimjogo'].includes(budy2)) {
            if (!isGroupAdmin) {
              await reply("✋ Somente os administradores do grupo podem encerrar um jogo da velha em andamento! 😊");
              return;
            };
            const result = tictactoe.endGame(from);
            await reply(result.message);
            return;
          };
          const position = parseInt(budy2.trim());
          if (!isNaN(position)) {
            const result = tictactoe.makeMove(from, sender, position);          
            if (result.success) {
              await nazu.sendMessage(from, { text: result.message, mentions: result.mentions || [sender] });
            } else if (result.message) {
              await reply(result.message);
            };
          };
          return;
        };
      } catch (error) {
        console.error("Erro no sistema de jogo da velha:", error);
      };
    };


    if (isGroup && groupData.blockedUsers && (groupData.blockedUsers[sender] || groupData.blockedUsers[sender.split('@')[0]]) && isCmd) {
      return reply(`🚫 Oops! Parece que você não pode usar comandos neste grupo.\nMotivo: ${groupData.blockedUsers[sender] ? groupData.blockedUsers[sender].reason : groupData.blockedUsers[sender.split('@')[0]].reason}`);
    };

    if (globalBlocks.users && (globalBlocks.users[sender.split('@')[0]] || globalBlocks.users[sender]) && isCmd) {
      return reply(`🚫 Parece que você está bloqueado de usar meus comandos globalmente.\nMotivo: ${globalBlocks.users[sender] ? globalBlocks.users[sender].reason : globalBlocks.users[sender.split('@')[0]].reason}`);
    };
    
    if (isCmd && globalBlocks.commands && globalBlocks.commands[command]) {
      return reply(`🚫 O comando *${command}* está temporariamente desativado globalmente.\nMotivo: ${globalBlocks.commands[command].reason}`);
    };


    if (isCmd && commandStats && commandStats.trackCommandUsage && command && command.length>0) {
      commandStats.trackCommandUsage(command, sender);
    };
 
 
    if(budy2.match(/^(\d+)d(\d+)$/))reply(+budy2.match(/^(\d+)d(\d+)$/)[1]>50||+budy2.match(/^(\d+)d(\d+)$/)[2]>100?"❌ Limite: max 50 dados e 100 lados":"🎲 Rolando "+budy2.match(/^(\d+)d(\d+)$/)[1]+"d"+budy2.match(/^(\d+)d(\d+)$/)[2]+"...\n🎯 Resultados: "+(r=[...Array(+budy2.match(/^(\d+)d(\d+)$/)[1])].map(_=>1+Math.floor(Math.random()*+budy2.match(/^(\d+)d(\d+)$/)[2]))).join(", ")+"\n📊 Total: "+r.reduce((a,b)=>a+b,0));

    if(budy2.includes('@'+nazu.user.id.split(':')[0]) && !isCmd) {
      if(budy2.replaceAll('@'+nazu.user.id.split(':')[0], '').length > 2) {
        jSoNzIn = { mensagem_original: budy2.replaceAll('@'+nazu.user.id.split(':')[0], ''), usuario_id: sender.split('@')[0] };
        let { participant, quotedMessage } = info.message?.extendedTextMessage?.contextInfo || {}, jsonO = { participant, quotedMessage, texto: quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text || quotedMessage?.imageMessage?.caption || quotedMessage?.videoMessage?.caption || quotedMessage?.documentMessage?.caption || "" };
        if(jsonO && jsonO.participant && jsonO.texto && jsonO.texto.length > 0) {
          jSoNzIn.mensagem_citada = jsonO.texto;
          jSoNzIn.usuario_mencionado_id = jsonO.participant.split('@')[0];
        };
        const respAssist = await ia.makeAssistentRequest(jSoNzIn);
        if(respAssist.acao && respAssist.dados && respAssist.mensagem_aguarde) {
          if(respAssist.acao === 'BANIR_USUARIO') {
            if(respAssist.dados && respAssist.dados.usuario_id) {
              if (!isGroupAdmin && !isOwner) return reply('Apenas admins me dão ordem para banir membros 🙄');
              await reply(respAssist.mensagem_aguarde);
              await nazu.groupParticipantsUpdate(from, [`${respAssist.dados.usuario_id}@s.whatsapp.net`], 'remove');
            };
          } else if(respAssist.acao === 'PROMOVER_USUARIO') {
            if(respAssist.dados && respAssist.dados.usuario_id) {
              if (!isGroupAdmin && !isOwner) return reply('Apenas admins me dão ordem para promover membros 🙄');
              await reply(respAssist.mensagem_aguarde);
              await nazu.groupParticipantsUpdate(from, [`${respAssist.dados.usuario_id}@s.whatsapp.net`], 'promote');
            };
          } else if(respAssist.acao === 'REBAIXAR_USUARIO') {
            if(respAssist.dados && respAssist.dados.usuario_id) {
              if (!isGroupAdmin && !isOwner) return reply('Apenas admins me dão ordem para rebaixar admins 🙄');
              await reply(respAssist.mensagem_aguarde);
              await nazu.groupParticipantsUpdate(from, [`${respAssist.dados.usuario_id}@s.whatsapp.net`], 'demote');
            };
          } else if(respAssist.acao === 'ABRIR_GRUPO') {
            if (!isGroupAdmin && !isOwner) return reply('Apenas admins me dão ordem para abrir ou fechar o grupo 🙄');
            await reply(respAssist.mensagem_aguarde);
            await nazu.groupSettingUpdate(from, 'not_announcement');
          } else if(respAssist.acao === 'FECHAR_GRUPO') {
            if (!isGroupAdmin && !isOwner) return reply('Apenas admins me dão ordem para abrir ou fechar o grupo 🙄');
            await reply(respAssist.mensagem_aguarde);
            await nazu.groupSettingUpdate(from, 'announcement');
          } else if(respAssist.acao === 'TOCAR_MUSICA') {
            if(respAssist.dados && respAssist.dados.musica) {
              await reply(respAssist.mensagem_aguarde);
              videoInfo = await youtube.search(respAssist.dados.musica);
              const caption = `📌 *Título:* ${videoInfo.data.title}\n👤 *Artista/Canal:* ${videoInfo.data.author.name}\n⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)\n\n🎧 *Baixando e processando sua música, aguarde...*`;
              await reply(caption);
              const dlRes = await youtube.mp3(videoInfo.data.url);
              if (!dlRes.ok) {
                return reply(`❌ Erro ao baixar o áudio: ${dlRes.msg}`);
              };
              await nazu.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
            };
          } else if(respAssist.acao === 'CRIAR_ENQUETE') {
            if(respAssist.dados && respAssist.dados.pergunta && respAssist.dados.opcoes) {
              await reply(respAssist.mensagem_aguarde);
              await nazu.sendMessage(from, {poll: {name: respAssist.dados.pergunta,values: respAssist.dados.opcoes.split('_'), selectableCount: 1}, messageContextInfo: { messageSecret: Math.random()}}, {from, options: { userJid: nazu?.user?.id }});
            };
          } else if(respAssist.acao === 'DELETAR_MENSAGEM') {
            if (!isGroupAdmin && !isOwner) return reply('Apenas admins me dão ordem para deletar mensagens 🙄');
            let stanzaId, participant;
            if (info.message.extendedTextMessage) {
              stanzaId = info.message.extendedTextMessage.contextInfo.stanzaId;
              participant = info.message.extendedTextMessage.contextInfo.participant || menc_prt;
            } else if (info.message.viewOnceMessage) {
              stanzaId = info.key.id;
              participant = info.key.participant || menc_prt;
            };
            try {
              await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: stanzaId, participant: participant } });
            } catch (error) {
              console.error(error);
            };
          } else if(respAssist.acao === 'ASSISTIR_FILME') {
            if(respAssist.dados && respAssist.dados.filme) {
              await reply(respAssist.mensagem_aguarde);
              datyz = await FilmesDL(respAssist.dados.filme);
              if(!datyz || !datyz.url) return;
              await nazu.sendMessage(from, {image: { url: datyz.img },caption: `Aqui está o que encontrei! 🎬\n\n*Nome*: ${datyz.name}\n\nSe tudo estiver certo, você pode assistir no link abaixo:\n${datyz.url}`}, { quoted: info });
            };
          } else if(respAssist.acao === 'CONSULTAR_COGNIMAI') {
            const resultPriv = await ia.makeCognimaRequest('cognimai', budy2.replaceAll('@'+nazu.user.id.split(':')[0], ''), `cog_${sender.split('@')[0]}`);
            if (!resultPriv.success) return;
            await reply(resultPriv.reply);
          } else if(respAssist.acao === 'CONVERSAR_COMO_HUMANO') {
            const resultPriv = await ia.makeCognimaRequest('nazuninha', budy2.replaceAll('@'+nazu.user.id.split(':')[0], ''), `nazuninha_${sender.split('@')[0]}`);
            if (!resultPriv.success) return;
            await reply(resultPriv.reply);
          } else if(respAssist.acao === 'ENVIAR_LEMBRETE') {
            if(respAssist.dados && respAssist.dados.lembrete && respAssist.dados.destino && respAssist.dados.data_hora ) {
              await reply(respAssist.mensagem_aguarde);
              const Data = respAssist.dados.data_hora;
              const JsonAc = { tipo: 'lembrete', texto: respAssist.dados.lembrete, destino: respAssist.dados.destino, from, sender, data: { ano: Data.split('-')[0], mes: Data.split('-')[1], dia: Data.split('-').pop().split(' ')[0] }, hora: { hora: Data.split(' ').pop().split(':')[0], minuto: Data.split(':').pop() } };
              const DIR_PROGRAM = path.join(DATABASE_DIR, 'prog_actions.json');
              if (!fs.existsSync(DIR_PROGRAM)) {
                await fs.writeFileSync(DIR_PROGRAM, JSON.stringify([], null, 2));
              };
              const ACTIONS = JSON.parse(fs.readFileSync(DIR_PROGRAM, 'utf-8'));
              ACTIONS.push(JsonAc);
              await fs.writeFileSync(DIR_PROGRAM, JSON.stringify(ACTIONS, null, 2));
            };
          } else if(respAssist.acao === 'PROGRAMAR_GRUPO') {
            if(respAssist.dados && respAssist.dados.acao && respAssist.dados.data_hora ) {
              if (!isGroupAdmin && !isOwner) return reply('Apenas admins me dão ordem para abrir ou fechar o grupo 🙄');
              await reply(respAssist.mensagem_aguarde);
              const Data = respAssist.dados.data_hora;
              const JsonAc = { tipo: 'grupo', acao: respAssist.dados.acao, from, sender, data: { ano: Data.split('-')[0], mes: Data.split('-')[1], dia: Data.split('-').pop().split(' ')[0] }, hora: { hora: Data.split(' ').pop().split(':')[0], minuto: Data.split(':').pop() } };
              const DIR_PROGRAM = path.join(DATABASE_DIR, 'prog_actions.json');
              if (!fs.existsSync(DIR_PROGRAM)) {
                await fs.writeFileSync(DIR_PROGRAM, JSON.stringify([], null, 2));
              };
              const ACTIONS = JSON.parse(fs.readFileSync(DIR_PROGRAM, 'utf-8'));
              ACTIONS.push(JsonAc);
              await fs.writeFileSync(DIR_PROGRAM, JSON.stringify(ACTIONS, null, 2));
            };
          };
        };
      };
    };


//COMECO DOS COMANDOS
switch(command) {
  
  
  

  case 'addsubdono':
    if (!isOwner || (isOwner && isSubOwner)) return reply("🚫 Apenas o Dono principal pode adicionar subdonos!");
    try {
      const targetUserJid = menc_jid2 && menc_jid2.length > 0 ? menc_jid2[0] : (q.includes('@') ? q.split(' ')[0].replace('@', '') + '@s.whatsapp.net' : null);
      if (!targetUserJid) {
        return reply("🤔 Você precisa marcar o usuário ou fornecer o número completo (ex: 5511999998888) para adicionar como subdono.");
      }
      const normalizedJid = targetUserJid.includes('@') ? targetUserJid : targetUserJid.replace(/\D/g, '') + '@s.whatsapp.net';
      const result = addSubdono(normalizedJid);
      await reply(result.message);
    } catch (e) {
      console.error("Erro ao adicionar subdono:", e);
      await reply("❌ Ocorreu um erro inesperado ao tentar adicionar o subdono.");
    }
    break;

  case 'remsubdono': case 'rmsubdono':
    if (!isOwner || (isOwner && isSubOwner)) return reply("🚫 Apenas o Dono principal pode remover subdonos!");
    try {
      const targetUserJid = menc_jid2 && menc_jid2.length > 0 ? menc_jid2[0] : (q.includes('@') ? q.split(' ')[0].replace('@', '') + '@s.whatsapp.net' : null);
      if (!targetUserJid) {
        return reply("🤔 Você precisa marcar o usuário ou fornecer o número completo (ex: 5511999998888) para remover como subdono.");
      }
      const normalizedJid = targetUserJid.includes('@') ? targetUserJid : targetUserJid.replace(/\D/g, '') + '@s.whatsapp.net';
      const result = removeSubdono(normalizedJid);
      await reply(result.message);
    } catch (e) {
      console.error("Erro ao remover subdono:", e);
      await reply("❌ Ocorreu um erro inesperado ao tentar remover o subdono.");
    }
    break;

  case 'listasubdonos':
    if (!isOwnerOrSub) return reply("🚫 Apenas o Dono e Subdonos podem ver a lista!");
    try {
      const subdonos = getSubdonos();
      if (subdonos.length === 0) {
        return reply("✨ Nenhum subdono cadastrado no momento.");
      }
      let listaMsg = "👑 *Lista de Subdonos Atuais:*\n\n";
      const mentions = [];
      let participantsInfo = {};
      if (isGroup && groupMetadata.participants) {
          groupMetadata.participants.forEach(p => {
              participantsInfo[p.id] = p.pushname || p.id.split('@')[0];
          });
      }
      subdonos.forEach((jid, index) => {
          const nameOrNumber = participantsInfo[jid] || jid.split('@')[0];
          listaMsg += `${index + 1}. @${jid.split('@')[0]} (${nameOrNumber})\n`;
          mentions.push(jid);
      });
      await reply(listaMsg.trim(), { mentions });
    } catch (e) {
      console.error("Erro ao listar subdonos:", e);
      await reply("❌ Ocorreu um erro inesperado ao tentar listar os subdonos.");
    }
    break;
  
  case 'modoaluguel':
    if (!isOwner || (isOwner && isSubOwner)) return reply("🚫 Apenas o Dono principal pode gerenciar o modo de aluguel!");
    try {
      const action = q.toLowerCase().trim();
      if (action === 'on' || action === 'ativar') {
        if (setRentalMode(true)) {
          await reply("✅ Modo de aluguel global ATIVADO! O bot agora só responderá em grupos com aluguel ativo.");
        } else {
          await reply("❌ Erro ao ativar o modo de aluguel global.");
        }
      } else if (action === 'off' || action === 'desativar') {
        if (setRentalMode(false)) {
          await reply("✅ Modo de aluguel global DESATIVADO! O bot responderá em todos os grupos permitidos.");
        } else {
          await reply("❌ Erro ao desativar o modo de aluguel global.");
        }
      } else {
        const currentStatus = isRentalModeActive() ? 'ATIVADO' : 'DESATIVADO';
        await reply(`🤔 Uso: ${prefix}modoaluguel on|off\nStatus atual: ${currentStatus}`);
      }
    } catch (e) {
      console.error("Erro no comando modoaluguel:", e);
      await reply("❌ Ocorreu um erro inesperado.");
    }
    break;

  case 'addaluguel':
    if (!isOwner) return reply("🚫 Apenas o Dono principal pode adicionar aluguel!");
    if (!isGroup) return reply("Este comando só pode ser usado em grupos.");
    try {
      const parts = q.toLowerCase().trim().split(' ');
      const durationArg = parts[0];
      let durationDays = null;

      if (durationArg === 'permanente') {
        durationDays = 'permanent';
      } else if (!isNaN(parseInt(durationArg)) && parseInt(durationArg) > 0) {
        durationDays = parseInt(durationArg);
      } else {
        return reply(`🤔 Duração inválida. Use um número de dias (ex: 30) ou a palavra "permanente".\nExemplo: ${prefix}addaluguel 30`);
      }

      const result = setGroupRental(from, durationDays);
      await reply(result.message);

    } catch (e) {
      console.error("Erro no comando addaluguel:", e);
      await reply("❌ Ocorreu um erro inesperado ao adicionar o aluguel.");
    }
    break;
  
  case 'upload':case 'imgpralink':case 'videopralink':case 'gerarlink': try {
  if(!isQuotedImage && !isQuotedVideo && !isQuotedDocument && !isQuotedAudio) return reply(`Marque um video, uma foto, um audio ou um documento`);
  var foto1 = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : {};
  var video1 = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : {};
  var docc1 = isQuotedDocument ? info.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage: {};
  var audio1 = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : "";
  let media = {};
  if(isQuotedDocument) {
  media = await getFileBuffer(docc1, "document");
  } else if(isQuotedVideo) {
  media = await getFileBuffer(video1, "video");
  } else if(isQuotedImage) {
  media = await getFileBuffer(foto1, "image");
  } else if(isQuotedAudio) {
  media = await getFileBuffer(audio1, "audio");
  };
  let linkz = await upload(media);
  await reply(`${linkz}`);
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break

  //DOWNLOADS & PESQUISAS
  
  // ===========================================
// cases.js - Comandos que o bot entende
// Comentários simples para facilitar a leitura
// Substitua 'SUA_KEY_AQUI' pela sua chave real de API:
// ===========================
// Bloco de comandos (switch-case)
// ===========================

// DEFINE LÁ EM CIMA, ESSA CONST 

// COLOCA AS CASES TUDO EMBAIXO DE ALGUM BREAK, MAS VOCÊ VAI TER QUE SUBSTITUIR TODAS AS CASES VELHAS, PELA NOVA..

// A FUNÇÃO reply(), PODE SER DIFERENTE, DEPENDENDO DO SEU BOT OU ENTÃO COMO VOCÊ DEFINIU, É O QUE VAI ENVIAR A RESPOSTA DE TEXTO, BOA SORTE.

// LEMBRE QUE AS VARIAVEIS E DEFINIÇÕES DO SEU BOT PODE SE4 DIFERENTE 
// TIPO O "conn" do conn.sendMessage e o "info" do {quoted: info} // o "q" por exemplo é o que vai pegar o que você digitou.

// Quem tiver interesse em javascript, comece com lógica de programação, vai abrir bastante sua mente, veja esses videos: https://youtube.com/playlist?list=PLfdDa19nz5SpJMLiGkRSctLH7QBr44goY 
// São 15, mas vale muito a pena ver, é bem engraçado tambem.. 

// Biblioteca do Baileys: https://github.com/Whiskeysockets/baileys
// Essa biblioteca é onde tem a conexão e funções necessárias pra o funcionamento do aleatory por exemplo o 3.6

// NÃO TIVER O FETCHJSON, VOU TE MANDAR COM AXIOS

// SE NÃO TIVER A DEFINIÇÃO DE formData 

// SE TIVER USANDO BAILEYS, E NÃO TIVER O getFileBuffer

// O downloadContentFromMessage é para definir onde fica as funções da baileys, lá em cima.. puxando o require.. da biblioteca...

// Tudo abaixo await sleep(1000) vai demorar 1 segundo pra funcionar, 1000 é igual 1 segundo..

// FUNÇÃO PARA GERAR LINK DE IMAGEM

// 

case "tabelacamp": case "tabela_camp": case "tabela-camp": case "campeonato": case "camptabela":
try {

var abc = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/tabela_camp?apikey=${API_KEY_BRONXYS}`)

let rst = "Tabela do Campeonato Brasileiro: \n\n"
for ( i = 0; i < abc.length; i++) {
rst += `• ( ${i+1} ) ° Time: ${abc[i].time}\n -> Pontos: ${abc[i].pontos}\n -> Jogos: ${abc[i].jogos}\n -> Vitorias: ${abc[i].vitorias}\n -> Empates: ${abc[i].empates}\n -> Derrotas: ${abc[i].derrotas}\n -> Gols Pro: ${abc[i].golsPro}\n -> Gols Contra: ${abc[i].golsContra}\n -> Saldo Gols; ${abc[i].saldoGols}\n -> Aproveitamento: ${abc[i].aproveitamento}\n\n------------------------------\n\n`
}
reply(rst)
} catch (a) {
console.log(a);
return reply("Erro, fale com o suporte para resolver o problema...");
}
break;

case "threads": case "thr":
if(!q.includes("threads.net")) return reply(`Cade o link do threads? Exemplo: ${prefix+command} https://www.threads.net/@tali_mito22/post/C_3_FbKyHtm/?xmt=AQGzOjjOpgW7PRhCZRcda0GvAqfvYqPWDwHgzn_v6_FVLQ`)
reply("Aguarde, estou enviando..")
try {
nazu.sendMessage(from, {video: {url: `https://api.bronxyshost.com.br/api-bronxys/threads?url=${q}&apikey=${API_KEY_BRONXYS}`}})
} catch (a) {
console.log(a);
return reply("Erro, tente falar com o suporte...")
}
break;

case 'gerarlink2': case 'imgpralink2': {
if((isMedia && info.message.imageMessage) || isQuotedImage) {
reply("🤖 - Pedido recebido, e enviando...")
var Fl = info?.message?.extendedTextMessage?.contextInfo?.quotedMessage
var muk = Fl?.viewOnceMessageV2?.message?.imageMessage || Fl?.viewOnceMessage?.message?.imageMessage || Fl?.imageMessage;
let base64String = await getFileBuffer(muk, "image");
var abcd = await uploadX(base64String)
reply(`Link da imagem: ${abcd}`);
} else {
return reply("Marque uma imagem, para que eu possa converter em link.")
}
}
break;

case "gruposwhatsapp":
reply("Enviando lista de grupos..")
try {
var abcd = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/gruposwhatsapp?apikey=${API_KEY_BRONXYS}`)

let gps = "Lista de Grupos:\n\n"

for ( i = 0; i < abcd.length; i++) {

gps += `${abcd[i].titulo}\n\nRegras: ${abcd[i].regras}\nLink: ${abcd[i].link}\n\n°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°\n\n`
}
reply(gps)
} catch (a) {
console.log(a);
return reply("Erro, tente falar com o suporte...")
}
break

case "soundcloud":
if(!q.trim().includes("soundcloud")) return reply("Cadê o link do soundcloud?")
try {
nazu.sendMessage(from, {audio: {url: `https://api.bronxyshost.com.br/api-bronxys/soundcloud?url=${q.trim()}&apikey=${API_KEY_BRONXYS}`}, mimetype: "audio/mpeg"}, {quoted: info})
} catch (e) {
console.log(e)
return reply("Erro...")
}
break;

case "ifunny": {
if(!q.trim()) return reply(`Faltando link do ifunny, Exemplo: https://br.ifunny.co/video/w9Eaa2bOB?s=cl`)
try {
nazu.sendMessage(from, {video: {url: `https://api.bronxyshost.com.br/api-bronxys/ifunny?url=${q.trim()}&apikey=${API_KEY_BRONXYS}`}, mimetype: "video/mp4"}, {quoted: info})
} catch (e) {
console.log(e)
reply("Erro...")
}
}
break;

case "transcrever": {
if((isMedia && !info.message.imageMessage && info.message.videoMessage || isQuotedVideo || isQuotedAudio)) {
reply("Aguarde.. transcrevendo seu áudio..")
muk = isQuotedVideo ? JSON.parse(JSON.stringify(info).replace('quotedM','m')).message.extendedTextMessage.contextInfo.message.videoMessage : isQuotedAudio ? JSON.parse(JSON.stringify(info).replace('quotedM','m')).message.extendedTextMessage.contextInfo.message.audioMessage : info.message.audioMessage

let base64String = await getFileBuffer(muk, isQuotedAudio ? 'audio': 'video');
let buffer = Buffer.from(base64String, 'base64');

let formData = new FormData();
formData.append('file', buffer, {filename: isQuotedAudio ? 'audiofile': 'videofile', contentType: muk.mimetype });

fetch(`https://api.bronxyshost.com.br/transcrever?apikey=${API_KEY_BRONXYS}`, {
method: 'POST',
body: formData
}).then(response => response.json())
.then(data => {
reply(data.texto);
}).catch((Err) => {
console.log(Err);
reply("Sinto muito, alguns formatos de áudio/vídeo, eu não consigo transcrever, em caso de dúvidas, tente novamente...");
});
} else {
return reply("Marque um audio ou um vídeo.")
}
}
break;

case 'grupos': {
reply("Realizando ação, aguarde.")
blue = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/grupos?q=${q}&apikey=${API_KEY_BRONXYS}`)
let red = "Listagem de grupos para você:\n\n"
blue.forEach(function(ab) {
red += ` - Url do Grupo: ${ab.link}\n\n - Descrição: ${ab.desc}\n\n${"-".repeat(20)}\n\n`
})
reply(red)
}
break;

case 'kwai': {
if(!q.trim().includes("kwai")) return reply(`Exemplo: ${prefix+command} LINK DO KWAI`);
reply("Aguarde, estou preparando..");
try {
nazu.sendMessage(from, {video: {url: `https://api.bronxyshost.com.br/api-bronxys/kwai?url=${q.trim()}&apikey=${API_KEY_BRONXYS}`}, mimetype: "video/mp4"}, {quoted: info})
} catch (e) {
console.log(e);
return reply("Erro...");
}
}
break;

case 'spotify': {
if(!q.trim().includes("spotify")) return reply(`Cadê a url do spotiy? exemplo: ${prefix+command} https://open.spotify.com/intl-pt/track/4m3mrHuttXhK58f6Tenai1\nNão baixo playlist, quiser pegar o link da música, acessa o site: https://open.spotify.com/search e pesquisa lá.`)
reply("🤖 - Pedido recebido, e enviando...");
try {
nazu.sendMessage(from, {audio: {url: `https://api.bronxyshost.com.br/api-bronxys/spotify?url=${q.trim()}&apikey=${API_KEY_BRONXYS}`}, mimetype: "audio/mpeg"}, {quoted: info}).catch(() => reply("Erro!"))
} catch (e) {
console.log(e);
return reply("Erro...");
}
}
break;

case "aptoide_pesquisa":
if(!q.trim()) return reply("Exemplo: WhatsApp")
try {
abc = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/aptoide_pesquisa?pesquisa=${q.trim()}&apikey=${API_KEY_BRONXYS}`)
reply(abc.aptoide)
} catch (e) {
console.log(e)
return reply("Erro...")
}
break;

case "aptoide":
if(!q.trim().includes("aptoide.com")) return reply(`Exemplo: ${prefix+command} link do aptoide\n\nUse o comando ${prefix}aptoide_pesquisa Exemplo: whatsapp, ae vai receber as url, pegue a url e use.`)
reply("🤖 - Pedido recebido, e enviando...")
try {
abc = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/aptoide?url=${q.trim()}&apikey=${API_KEY_BRONXYS}`)
nazu.sendMessage(from, {document: {url: abc.link}, mimetype: "application/vnd.android.package-archive", fileName: abc.titulo}, {quoted: info}).catch((e) => console.log(e))
} catch (e) {
console.log(e)
return reply("Erro...")
}
break;

// DOWNLOADS

case 'play': {
try {
if(!q.trim()) return reply(`- Exemplo: ${prefix}play nome da música\na música será baixada, só basta escolher áudio ou vídeo, se não baixar, o YouTube privou de não baixarem, ou algo do tipo..`)
data = await fetchJson(`${siteapi}/api-bronxys/pesquisa_ytb?nome=${q}&apikey=${API_KEY_BRONXYS}`)
if(data[0]?.tempo?.length >= 7) return reply("Desculpe, este video ou audio é muito grande, não poderei realizar este pedido, peça outra música abaixo de uma hora.")
var N_E = " Não encontrado."
var bla = `
🤖 𝚈𝙾𝚂𝚄𝙺𝙴 𝙿𝙻𝙰𝚈𝚂 - 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝚂 ✨

📌 Titulo: ${data[0]?.titulo||N_E}
⏲️ Tempo: ${data[0]?.tempo||N_E}
📝 Postado: ${data[0]?.postado||N_E}
🧾 Descrição: ${data[0]?.desc||N_E}

Quer baixar o video? Use: ${prefix}play_video ${q.trim()}
`
nazu.sendMessage(from, {image: {url: data[0]?.thumb || logoslink?.logo}, caption: bla}, {quoted: info})
nazu.sendMessage(from, {audio: {url: `${siteapi}/api-bronxys/play?nome_url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "audio/mpeg", fileName: data[0]?.titulo || "play.mp3"}, {quoted: info}).catch(e => {
return reply("⚠️Error! tente outra música, ou aguarde o play retornar.")
})
} catch (e) {
console.log(e)
return reply("⚠️Error! tente outra música, ou aguarde o play retornar.");
}
}
break;

case 'playmp4':  case "play_video": {
try {
if(!q.trim()) return reply(`- Exemplo: ${prefix}play nome da música\na música será baixada, só basta escolher áudio ou vídeo, se não baixar, o YouTube privou de não baixarem, ou algo do tipo..`)
data = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/pesquisa_ytb?nome=${q}&apikey=${API_KEY_BRONXYS}`)
if(data[0]?.tempo?.length >= 7) return reply("Desculpe, este video ou audio é muito grande, não poderei realizar este pedido, peça outra música abaixo de uma hora.")
var N_E = " Não encontrado."
var bla = `
๖ۣ• Titulo: ${data[0]?.titulo||N_E}
๖ۣ• Tempo: ${data[0]?.tempo||N_E}
๖ۣ• Postado: ${data[0]?.postado||N_E}
๖ۣ• Descrição: ${data[0]?.desc||N_E}

■■■■■ 100% 

E᥉ᥴ᥆ᥣhᥲ ᥙ꧑ᥲ ᥆ρᥴᥲ᥆...

Se desejar baixar o áudio, use ${prefix}play ${q.trim()}
`
nazu.sendMessage(from, {image: {url: data[0]?.thumb || logoslink?.logo}, caption: bla}, {quoted: info})
nazu.sendMessage(from, {video: {url: `https://api.bronxyshost.com.br/api-bronxys/play_video?nome_url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "video/mp4", fileName: data[0]?.titulo || "play.mp4"}, {quoted: info}).catch(e => {
return reply("Erro..")
})
} catch (e) {
console.log(e)
return reply("Seja mais específico, não deu pra encontrar com apenas isto... / Erro");
}
}
break;

case 'playdoc':
try {
if(!q.trim()) return reply(`- Exemplo: ${prefix}play nome da música\na música será baixada, só basta escolher áudio ou vídeo, se não baixar, o YouTube privou de não baixarem, ou algo do tipo..`)
data = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/pesquisa_ytb?nome=${q}&apikey=${API_KEY_BRONXYS}`)
if(data[0]?.tempo?.length >= 7) return reply("Desculpe, este video ou audio é muito grande, não poderei realizar este pedido, peça outra música abaixo de uma hora.")
var N_E = " Não encontrado."
var bla = `
๖ۣ• Titulo: ${data[0]?.titulo||N_E}
๖ۣ• Tempo: ${data[0]?.tempo||N_E}
๖ۣ• Postado: ${data[0]?.postado||N_E}
๖ۣ• Descrição: ${data[0]?.desc||N_E}

■■■■■ 100%

Enviando documento...

Se deseja baixar o video, use ${prefix}playmp4 ${q.trim()}

Se deseja baixar o áudio, use ${prefix}play ${q.trim()}
`
nazu.sendMessage(from, {image: {url: data[0]?.thumb || logoslink.logo}, caption: bla}, {quoted: info})
nazu.sendMessage(from, {document: {url: `https://api.bronxyshost.com.br/api-bronxys/play?nome_url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "audio/mpeg", fileName: data[0]?.titulo || "play.mp3"}, {quoted: info}).catch(e => {
return reply("Erro..")
})
} catch (e) {
console.log(e)
return reply("Seja mais específico, não deu pra encontrar com apenas isto... / Erro");
}
break;

case 'tiktok':
try {
if(!q.includes("tiktok")) return reply(`${prefix+command} link do Tiktok`);
reply("Realizando ação..");
nazu.sendMessage(from, {video: {url:`https://api.bronxyshost.com.br/api-bronxys/tiktok?url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "video/mp4"}, {quoted: info}).catch(e => {
console.log(e)
return reply("Erro..")
})
} catch (e) {
console.log(e)
return reply("Erro...");
}
break;

case 'tiktok_audio':
try {
if(!q.includes("tiktok")) return reply(`${prefix+command} link do Tiktok`);
reply("Realizando ação..");
nazu.sendMessage(from, {audio: {url:`https://api.bronxyshost.com.br/api-bronxys/tiktok?url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "audio/mpeg"}, {quoted: info}).catch(e => {
console.log(e)
return reply("Erro..")
})
} catch (e) {
console.log(e)
return reply("Erro...");
}
break;

case 'facebook':
try {
if(!q.includes("facebook") && !q.includes("fb.watch")) return reply(`Exemplo: ${prefix+command} o link do Facebook`);
reply("Realizando ação..")
nazu.sendMessage(from, {video: {url: `https://api.bronxyshost.com.br/api-bronxys/${command}?url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "video/mp4"}).catch(e => {
return reply("Erro..")
})
} catch (e) {
return reply("Erro..")
}
break;

case 'face_audio':
try {
if(!q.includes("facebook") && !q.includes("fb.watch")) return reply(`Exemplo: ${prefix+command} o link do Facebook`);
reply("Realizando ação..")
nazu.sendMessage(from, {audio: {url: `https://api.bronxyshost.com.br/api-bronxys/${command}?url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "audio/mpeg"}).catch(e => {
return reply("Erro..")
})
} catch (e) {
return reply("Erro..")
}
break;

case 'twitter':
try {
if(!q.includes("twitter")) return reply(`Exemplo: ${prefix+command} o link do Twitter`);
reply("Realizando ação..")
nazu.sendMessage(from, {video: {url: `https://api.bronxyshost.com.br/api-bronxys/${command}?url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "video/mp4"}).catch(e => {
return reply("Erro..")
})
} catch (e) {
return reply("Erro..")
}
break;

case 'twitter_audio':
try {
if(!q.includes("twitter")) return reply(`Exemplo: ${prefix+command} o link do Twitter`);
reply("Realizando ação..")
nazu.sendMessage(from, {audio: {url: `https://api.bronxyshost.com.br/api-bronxys/${command}?url=${q}&apikey=${API_KEY_BRONXYS}`}, mimetype: "audio/mpeg"}).catch(e => {
return reply("Erro..")
})
} catch (e) {
return reply("Erro..")
}
break;

case 'instagram':
try {
if(q.length < 5) return reply(`Exemplo: ${prefix+command} o link`);
ABC = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/instagram?url=${q.trim()}&apikey=${API_KEY_BRONXYS}`)
reply("Realizando ação..")
let DM_T = ABC.msg[0].type
var A_T = DM_T === "mp4" ? "video/mp4" : DM_T === "webp" ? "image/webp" : DM_T === "jpg" ? "image/jpeg" : DM_T === "mp3" ? "audio/mpeg" : "video/mp4"
nazu.sendMessage(from, {[A_T.split("/")[0]]: {url: ABC.msg[0].url}, mimetype: A_T}, {quoted: info}).catch(e => {
return reply("Erro..")
})
} catch (e) {
return reply("Erro..")
}
break;

case 'insta_audio':
try {
if(!q.trim()) return reply(`Exemplo: ${prefix+command} o link`);
ABC = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/instagram?url=${q.trim()}&apikey=${API_KEY_BRONXYS}`)
reply("AGUARDE, REALIZANDO AÇÃO.")
let DM_T = ABC.msg[0].type
var A_T = DM_T === "webp" ? "image/webp" : DM_T === "jpg" ? "image/jpeg" : DM_T === "mp3" ? "audio/mpeg" : "audio/mpeg"
nazu.sendMessage(from, {[A_T.split("/")[0]]: {url: ABC.msg[0].url}, mimetype: A_T}, {quoted: info}).catch(e => {
return reply("Erro..")
})
} catch (e) {
return reply("Erro..")
}
break;

case 'mediafire':
try {
if(!q.includes("mediafire.com")) return reply("Faltando o link do mediafire para download do arquivo, cade?");
ABC = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/mediafire?url=${q}&apikey=${API_KEY_BRONXYS}`)
reply(`Enviando: ${ABC.resultado[0].nama}\n\nPeso: ${ABC.resultado[0].size}`)
nazu.sendMessage(from, {document: {url: ABC.resultado[0].link}, mimetype: "application/"+ABC.resultado[0].mime, fileName: ABC.resultado[0].nama}).catch(e => {
return reply("Erro..");
})
} catch (e) {
console.log(String(e))
return reply("Erro..")
}
break;

case 'signo':
try {
if(!q.trim()) return reply(`Digite seu signo, exemplo: ${prefix+command} virgem`);
ABC = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/horoscopo?signo=${q}&apikey=${API_KEY_BRONXYS}`)
nazu.sendMessage(from, {image: {url: ABC.img}, caption: `Signo: ${q}\n\n${ABC.title}\n${ABC.body}`}).catch(e => {
return reply("Erro..");
})
} catch (e) {
return reply("Erro..");
}
break;

//INFORMAR
case 'moedas': case 'moeda':
try {
ABC = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/Moedas_Agora?apikey=${API_KEY_BRONXYS}`)
reply(`${ABC?.dolar}\n\n${ABC?.euro}\n\n${ABC?.libra}\n\n${ABC?.bitcoin}\n\n${ABC?.ethereum}\n\n${ABC?.bovespa}\n\n${ABC?.ouro}`);
} catch {
return reply("Erro, breve volta.")
}
break;

case "letra": case "liryc": case "letram": case "letramusic": case "letramusica": {
if(!q.trim()) return reply(`Exemplo: ${prefix+command} Ela me traiu`)
try {
reply("Aguarde...")
const abc = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/letra_musica?letra=${q.trim()}&apikey=${API_KEY_BRONXYS}`)
reply(` - Titulo: ${abc.titulo}\n\n - Compositor: ${abc.compositor}\n\n - Letra: ${abc.letra}`)
} catch (e) {
reply("Erro...")
}
}
break;

case 'pergunta': case 'openai': case 'gpt': case 'chatgpt':
try {
reply("Aguarde, criando / pesquisando sobre o que esta perguntando ou pedindo.");
ABC = await fetchJson(`https://api.bronxyshost.com.br/api-bronxys/PERGUNTE_E_EU_RESPONDO?q=${q.trim()}&apikey=${API_KEY_BRONXYS}`)
reply(`( ${ABC.msg} )`)
} catch { 
reply("Erro..")
}
break;

//FIM DOS DOWNLOADS & PESQUISAS\\
  

 /* MENUS DO BOT */  
case 'menu': case 'help':
try {
nazu.sendMessage(from, {audio: {url: `./media/menucmd.mp3`}, mimetype: "audio/mpeg"}, {quoted: info});
await sleep(1000)
const menuImagePath = './media/menu.jpg';
const mediaPath = menuImagePath;
const mediaBuffer = fs.readFileSync(mediaPath);
const menuText = await menu(prefix, nomebot, pushname, botVersion);
await nazu.sendMessage(from, {image: mediaBuffer, caption: menuText, mimetype: 'image/jpeg'}, { quoted: info });
    } catch (error) {
console.error('Erro ao enviar menu:', error);
const menuText = await menu(prefix, nomebot, pushname, botVersion);
await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
    }
break;

case 'alteradores':
try {
const menuImagePath = './media/menu.jpg';
const mediaPath = menuImagePath;
const mediaBuffer = fs.readFileSync(mediaPath);
const menuText2 = await menuAlterador(prefix, nomebot, pushname, botVersion);
await nazu.sendMessage(from, {image: mediaBuffer, caption: menuText2, mimetype: 'image/jpeg'}, { quoted: info });
    } catch (error) {
console.error('Erro ao enviar menu:', error);
const menuText = await menuAlterador(prefix, nomebot, pushname, botVersion);
await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
    }
break;
    
case 'brincadeira':
case 'Brincadeiras':
try {
const menuImagePath = './media/menu.jpg';
const mediaPath = menuImagePath;
const mediaBuffer = fs.readFileSync(mediaPath);
const menuText3 = await menubn(prefix, nomebot, pushname, botVersion);
await nazu.sendMessage(from, {image: mediaBuffer, caption: menuText3, mimetype: 'image/jpeg'}, { quoted: info });
    } catch (error) {
console.error('Erro ao enviar menu:', error);
const menuText = await menubn(prefix, nomebot, pushname, botVersion);
await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
    }
break;   
  
case 'menuadm':
try {
const menuImagePath = './media/menu.jpg';
const mediaPath = menuImagePath;
const mediaBuffer = fs.readFileSync(mediaPath);
const menuText4 = await menuadm(prefix, nomebot, pushname, botVersion);
await nazu.sendMessage(from, {image: mediaBuffer, caption: menuText4, mimetype: 'image/jpeg'}, { quoted: info });
    } catch (error) {
console.error('Erro ao enviar menu:', error);
const menuText = await menuadm(prefix, nomebot, pushname, botVersion);
await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
    }
break;

case 'menudono':
try {
const menuImagePath = './media/menu.jpg';
const mediaPath = menuImagePath;
const mediaBuffer = fs.readFileSync(mediaPath);
const menuText5 = await menuDono(prefix, nomebot, pushname, botVersion);
await nazu.sendMessage(from, {image: mediaBuffer, caption: menuText5, mimetype: 'image/jpeg'}, { quoted: info });
    } catch (error) {
console.error('Erro ao enviar menu:', error);
const menuText = await menuDono(prefix, nomebot, pushname, botVersion);
await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
    }
break;
    

   
  case 'antipv3':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv3' ? null : 'antipv3';
    fs.writeFileSync('./dados/database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv3 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'bloqueia usuários que usam comandos no privado' : 'responde normalmente no privado'}.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antipv2':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv2' ? null : 'antipv2';
    fs.writeFileSync('./dados/database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv2 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'avisa que comandos só funcionam em grupos no privado' : 'responde normalmente no privado'}.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antipv':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv' ? null : 'antipv';
    fs.writeFileSync('./dados/database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'ignora mensagens no privado' : 'responde normalmente no privado'}.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'entrar':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    if (!q || !q.includes('chat.whatsapp.com')) return reply('Digite um link de convite válido! Exemplo: '+prefix+'entrar https://chat.whatsapp.com/...');
    const code = q.split('https://chat.whatsapp.com/')[1];
    await nazu.groupAcceptInvite(code).then((res) => {
      reply(`✅ Entrei no grupo com sucesso!`);
    }).catch((err) => {
      reply('❌ Erro ao entrar no grupo. Link inválido ou permissão negada.');
    });
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'tm':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    if (!q && !isQuotedImage && !isQuotedVideo) return reply('Digite uma mensagem ou marque uma imagem/vídeo! Exemplo: '+prefix+'tm Olá a todos!');
    let message = {};
    if (isQuotedImage) {
      const image = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, 'image');
      message = { image, caption: q || 'Transmissão do dono!' };
    } else if (isQuotedVideo) {
      const video = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage, 'video');
      message = { video, caption: q || 'Transmissão do dono!' };
    } else {
      message = { text: q };
    }
    const groups = await nazu.groupFetchAllParticipating();
    for (const group of Object.values(groups)) {
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (30000 - 10000) + 10000)));
      await nazu.sendMessage(group.id, message);
    }
    await reply(`✅ Transmissão enviada para ${Object.keys(groups).length} grupos!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'cases':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const indexContent = fs.readFileSync(__dirname + '/index.js', 'utf-8');
    const caseRegex = /case\s+'([^']+)'\s*:/g;
    const cases = new Set();
    let match;
    while ((match = caseRegex.exec(indexContent)) !== null) {
      cases.add(match[1]);
    };
    const multiCaseRegex = /case\s+'([^']+)'\s*:\s*case\s+'([^']+)'\s*:/g;
    while ((match = multiCaseRegex.exec(indexContent)) !== null) {
      cases.add(match[1]);
      cases.add(match[2]);
    };
    const caseList = Array.from(cases).sort();
    await reply(`📜 *Lista de Comandos (Cases)*:\n\n${caseList.join('\n')}\n\nTotal: ${caseList.length} comandos`);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'getcase':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    if (!q) return reply('❌ Digite o nome do comando. Exemplo: '+prefix+'getcase menu');
    caseCode = 'case '+`'${cases}'`+fs.readFileSync("./index.js").toString().split('case \''+cases+'\'')[1].split("bre"+"ak")[0]+"brea"+"k";
    await nazu.sendMessage(from, { document: Buffer.from(caseCode, 'utf-8'), mimetype: 'text/plain', fileName: `${q}.txt` }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
  case 'boton':
  case 'botoff':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const botStateFile = './dados/database/botState.json';
    
    const isOn = botState.status === 'on';
    if (command === 'boton' && isOn) {
      return reply('🌟 O bot já está ativado!');
    }
    if (command === 'botoff' && !isOn) {
      return reply('🌙 O bot já está desativado!');
    }

    botState.status = command === 'boton' ? 'on' : 'off';
    fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));

    const message = command === 'boton' ? '✅ *Bot ativado!* Agora todos podem usar os comandos.' : '✅ *Bot desativado!* Apenas o dono pode usar comandos.';
    
    await reply(message);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'blockcmdg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const cmdToBlock = q?.toLowerCase().split(' ')[0];
    const reason = q?.split(' ').slice(1).join(' ') || 'Sem motivo informado';
    if (!cmdToBlock) return reply('❌ Informe o comando a bloquear! Ex.: '+prefix+'blockcmd sticker');
    const blockFile = './dados/database/globalBlocks.json';
    globalBlocks.commands = globalBlocks.commands || {};
    globalBlocks.commands[cmdToBlock] = { reason, timestamp: Date.now() };
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Comando *${cmdToBlock}* bloqueado globalmente!\nMotivo: ${reason}`);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'unblockcmdg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const cmdToUnblock = q?.toLowerCase().split(' ')[0];
    if (!cmdToUnblock) return reply('❌ Informe o comando a desbloquear! Ex.: '+prefix+'unblockcmd sticker');
    const blockFile = './dados/database/globalBlocks.json';
    if (!globalBlocks.commands || !globalBlocks.commands[cmdToUnblock]) {
      return reply(`❌ O comando *${cmdToUnblock}* não está bloqueado!`);
    }
    delete globalBlocks.commands[cmdToUnblock];
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Comando *${cmdToUnblock}* desbloqueado globalmente!`);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'blockuserg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    reason = q ? q.includes('@') ? q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Não informado" : q : 'Não informado';
    menc_os3 = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
    if(!menc_os3) return reply("Marque alguém 🙄");
    const blockFile = './dados/database/globalBlocks.json';
    globalBlocks.users = globalBlocks.users || {};
    globalBlocks.users[menc_os3] = { reason, timestamp: Date.now() };
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Usuário @${menc_os3.split('@')[0]} bloqueado globalmente!\nMotivo: ${reason}`, { mentions: [menc_os3] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'unblockuserg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    if(!menc_os2) return reply("Marque alguém 🙄");
    const blockFile = './dados/database/globalBlocks.json';
    if (!globalBlocks.users || (!globalBlocks.users[menc_os2] && !globalBlocks.users[menc_os2.split('@')[0]])) {
      return reply(`❌ O usuário @${menc_os2.split('@')[0]} não está bloqueado!`, { mentions: [menc_os2] });
    }
    if (globalBlocks.users[menc_os2]) {
    delete globalBlocks.users[menc_os2];
    } else if (globalBlocks.users[menc_os2.split('@')[0]]) {
    delete globalBlocks.users[menc_os2.split('@')[0]];
    }
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Usuário @${menc_os2.split('@')[0]} desbloqueado globalmente!`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'listblocks':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const blockFile = './dados/database/globalBlocks.json';
    const blockedCommands = globalBlocks.commands ? Object.entries(globalBlocks.commands).map(([cmd, data]) => `🔧 *${cmd}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum comando bloqueado.';
    const blockedUsers = globalBlocks.users ? Object.entries(globalBlocks.users).map(([user, data]) => {const userId = user.split('@')[0]; return `👤 *${userId}* - Motivo: ${data.reason}`;}).join('\n') : 'Nenhum usuário bloqueado.';
    const message = `🔒 *Bloqueios Globais - ${nomebot}* 🔒\n\n📜 *Comandos Bloqueados*:\n${blockedCommands}\n\n👥 *Usuários Bloqueados*:\n${blockedUsers}`;    
    await reply(message);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'seradm': try {
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  await nazu.groupParticipantsUpdate(from, [sender], "promote");
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'sermembro': try {
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  await nazu.groupParticipantsUpdate(from, [sender], "demote");
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

   case 'prefixo':case 'numerodono':case 'nomedono':case 'nomebot': try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!q) return reply(`Uso correto: ${prefix}${command} <valor>`);
     let config = JSON.parse(fs.readFileSync('./dono/config.json'));
     config[command] = q;
     fs.writeFileSync('./dono/config.json', JSON.stringify(config, null, 2));
     reply(`✅ ${command} atualizado para: *${q}*`);
   } catch (e) {
   console.error(e);
   reply("ocorreu um erro 💔");
   };
  break;
  
  case 'fotomenu':case 'videomenu':case 'mediamenu':case 'midiamenu': try {
   if(!isOwner) return reply("Este comando é apenas para o meu dono");
   if(fs.existsSync(__dirname+'/../midias/menu.jpg')) fs.unlinkSync(__dirname+'/../midias/menu.jpg');
   if(fs.existsSync(__dirname+'/../midias/menu.mp4')) fs.unlinkSync(__dirname+'/../midias/menu.mp4');
   var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
    fs.writeFileSync(__dirname+'/../midias/menu.' + (isVideo2 ? 'mp4' : 'jpg'), buffer);
    await reply('✅ Mídia do menu atualizada com sucesso.');
  } catch(e) {
   console.error(e);
   reply("ocorreu um erro 💔");
  }
  break
  
  case 'bangp':case 'unbangp':case 'desbangp': try {
  if(!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  banGpIds[from] = !banGpIds[from];
  if(banGpIds[from]) {
  await reply('🚫 Grupo banido, apenas usuarios premium ou meu dono podem utilizar o bot aqui agora.');
  } else {
  await reply('✅ Grupo desbanido, todos podem utilizar o bot novamente.');
  };
  fs.writeFileSync(`./dados/database/dono/bangp.json`, JSON.stringify(banGpIds));
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'addpremium':case 'addvip':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!menc_os2) return reply("Marque alguém 🙄");
    if(!!premiumListaZinha[menc_os2]) return reply('O usuário ja esta na lista premium.');
    premiumListaZinha[menc_os2] = true;
    await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi adicionado(a) a lista premium.`, mentions: [menc_os2] }, { quoted: info });
    fs.writeFileSync(`./dados/database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'delpremium':case 'delvip':case 'rmpremium':case 'rmvip':
  try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if(!menc_os2) return reply("Marque alguém 🙄");
    if(!premiumListaZinha[menc_os2]) return reply('O usuário não esta na lista premium.');
    delete premiumListaZinha[menc_os2];
    await nazu.sendMessage(from, {text: `🫡 @${menc_os2.split('@')[0]} foi removido(a) da lista premium.`, mentions: [menc_os2] }, { quoted: info });
    fs.writeFileSync(`./dados/database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'addpremiumgp':case 'addvipgp':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if(!!premiumListaZinha[from]) return reply('O grupo ja esta na lista premium.');
    premiumListaZinha[from] = true;
    await nazu.sendMessage(from, {text: `✅ O grupo foi adicionado a lista premium.` }, { quoted: info });
    fs.writeFileSync(`./dados/database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'delpremiumgp':case 'delvipgp':case 'rmpremiumgp':case 'rmvipgp':
  try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if(!premiumListaZinha[from]) return reply('O grupo não esta na lista premium.');
    delete premiumListaZinha[from];
    await nazu.sendMessage(from, {text: `🫡 O grupo foi removido da lista premium.` }, { quoted: info });
    fs.writeFileSync(`./dados/database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  //COMANDOS GERAIS
  case 'rvisu':case 'open':case 'revelar': try {
  var RSMM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage
  var boij22 = RSMM?.imageMessage || info.message?.imageMessage || RSMM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSMM?.viewOnceMessage?.message?.imageMessage;
  var boijj = RSMM?.videoMessage || info.message?.videoMessage || RSMM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSMM?.viewOnceMessage?.message?.videoMessage;
  var boij33 = RSMM?.audioMessage || info.message?.audioMessage || RSMM?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessage?.message?.audioMessage || RSMM?.viewOnceMessage?.message?.audioMessage;
  if(boijj) {
  var px = boijj;
  px.viewOnce = false;
  px.video = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else if(boij22) {
  var px = boij22;
  px.viewOnce = false;
  px.image = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else if(boij33) {
  var px = boij33;
  px.viewOnce = false;
  px.audio = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else {
  return reply('Por favor, *mencione uma imagem, video ou áudio em visualização única* para executar o comando.');
  };
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  
case 'rankativos': 
  case 'rankativo': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    blue67 = groupData.contador.sort((a, b) => ((a.figu == undefined ? a.figu = 0 : a.figu + a.msg + a.cmd) < (b.figu == undefined ? b.figu = 0 : b.figu + b.cmd + b.msg)) ? 0 : -1);
    menc = [];
    blad = `*🏆 Rank dos ${blue67.length < 10 ? blue67.length : 10} mais ativos do grupo:*\n`;
    for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
        if (i6 != null) blad += `\n*🏅 ${i6 + 1}º Lugar:* @${blue67[i6].id.split('@')[0]}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
        if(!groupData.mark) groupData.mark = {};
        if(!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
        menc.push(blue67[i6].id);
        };
    };
    await nazu.sendMessage(from, {text: blad, mentions: menc}, {quoted: info});
  } catch(e) {
  console.error('Não tem membroe o suficiente para marcar');
  await reply(`📢Erro no comando: '${command}' erro:`+e);
  };
  break;

  case 'rankinativos': 
  case 'rankinativo': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    blue67 = groupData.contador.sort((a, b) => {
  const totalA = (a.figu ?? 0) + a.msg + a.cmd;
  const totalB = (b.figu ?? 0) + b.msg + b.cmd;
  return totalA - totalB;
});
    menc = [];
    blad = `*🗑️ Rank dos ${blue67.length < 10 ? blue67.length : 10} mais inativos do grupo:*\n`;
    for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
        if (i6 != null) blad += `\n*🏅 ${i6 + 1}º Lugar:* @${blue67[i6].id.split('@')[0]}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
        if(!groupData.mark) groupData.mark = {};
        if(!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
        menc.push(blue67[i6].id);
        };
    };
    await nazu.sendMessage(from, {text: blad, mentions: menc}, {quoted: info});
  } catch(e) {
  console.error(e);
  reply("ocorreu um erro 💔");
  };
  break;
  
  case 'totalcmd':
  case 'totalcomando': try {
    fs.readFile('./index.js', 'utf8', async (err, data) => {
      if (err) throw err;
      const comandos = [...data.matchAll(/case [`'"](\w+)[`'"]/g)].map(m => m[1]);
      await nazu.sendMessage(from, {image: {url: `https://api.cognima.com.br/api/banner/counter?key=CognimaTeamFreeKey&num=${String(comandos.length)}&theme=miku`}, caption: `╭〔 🤖 *Meus Comandos* 〕╮\n`+`┣ 📌 Total: *${comandos.length}* comandos\n`+`╰━━━━━━━━━━━━━━━╯`}, { quoted: info });
    });
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    }
  break;
 
 case 'meustatus':
  try {
    let groupMessages = 0;
    let groupCommands = 0;
    let groupStickers = 0;
    if (isGroup && groupData.contador && Array.isArray(groupData.contador)) {
      const userData = groupData.contador.find(u => u.id === sender);
      if (userData) {
        groupMessages = userData.msg || 0;
        groupCommands = userData.cmd || 0;
        groupStickers = userData.figu || 0;
      };
    };
    let totalMessages = 0;
    let totalCommands = 0;
    let totalStickers = 0;
    const groupFiles = fs.readdirSync('./dados/database/grupos').filter(file => file.endsWith('.json'));
    for (const file of groupFiles) {
      try {
        const groupData = JSON.parse(fs.readFileSync(`./dados/database/grupos/${file}`));
        if (groupData.contador && Array.isArray(groupData.contador)) {
          const userData = groupData.contador.find(u => u.id === sender);
          if (userData) {
            totalMessages += (userData.msg || 0);
            totalCommands += (userData.cmd || 0);
            totalStickers += (userData.figu || 0);
          };
        };
      } catch (e) {
        console.error(`Erro ao ler ${file}:`, e);
      };
    };
    const userName = pushname || sender.split('@')[0];
    const userStatus = isOwner ? 'Dono' : isPremium ? 'Premium' : isGroupAdmin ? 'Admin' : 'Membro';
    let profilePic = null;
    try {
      profilePic = await nazu.profilePictureUrl(sender, 'image');
    } catch (e) {};
    const statusMessage = `📊 *Meu Status - ${userName}* 📊\n\n👤 *Nome*: ${userName}\n📱 *Número*: @${sender.split('@')[0]}\n⭐ *Status*: ${userStatus}\n\n${isGroup ? `\n📌 *No Grupo: ${groupName}*\n💬 Mensagens: ${groupMessages}\n⚒️ Comandos: ${groupCommands}\n🎨 Figurinhas: ${groupStickers}\n` : ''}\n\n🌐 *Geral (Todos os Grupos)*\n💬 Mensagens: ${totalMessages}\n⚒️ Comandos: ${totalCommands}\n🎨 Figurinhas: ${totalStickers}\n\n✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
    if (profilePic) {
      await nazu.sendMessage(from, { image: { url: profilePic }, caption: statusMessage, mentions: [sender] }, { quoted: info });
    } else {
      await nazu.sendMessage(from, { text: statusMessage, mentions: [sender] }, { quoted: info });
    };
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'topcmd':
  case 'topcmds':
  case 'comandosmaisusados':
  try {
    const topCommands = commandStats.getMostUsedCommands(10);
    const menuVideoPath = './dados/midias/menu.mp4';
    const menuImagePath = './dados/midias/menu.jpg';
    const useVideo = fs.existsSync(menuVideoPath);
    const mediaPath = useVideo ? menuVideoPath : menuImagePath;
    const mediaBuffer = fs.readFileSync(mediaPath);
    const menuText = await menuTopCmd(prefix, nomebot, pushname, topCommands);
    await nazu.sendMessage(from, { [useVideo ? 'video' : 'image']: mediaBuffer, caption: menuText, gifPlayback: useVideo, mimetype: useVideo ? 'video/mp4' : 'image/jpeg' }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
  case 'cmdinfo':
  case 'comandoinfo':
  try {
    if (!q) return reply(`Por favor, especifique um comando para ver suas estatísticas.\nExemplo: ${prefix}cmdinfo menu`);
    
    const cmdName = q.startsWith(prefix) ? q.slice(prefix.length) : q;

    const stats = commandStats.getCommandStats(cmdName);
    
    if (!stats) {
      return reply(`❌ Comando *${cmdName}* não encontrado ou nunca foi usado.`);
    }

    const topUsersText = stats.topUsers.length > 0 ? stats.topUsers.map((user, index) => { return `${index + 1}º @${user.userId.split('@')[0]} - ${user.count} usos`; }).join('\n') : 'Nenhum usuário registrado';
    
    const lastUsed = new Date(stats.lastUsed).toLocaleString('pt-BR');
    
    const infoMessage = `📊 *Estatísticas do Comando: ${prefix}${stats.name}* 📊\n\n` + `📈 *Total de Usos*: ${stats.count}\n` + `👥 *Usuários Únicos*: ${stats.uniqueUsers}\n` + `🕒 *Último Uso*: ${lastUsed}\n\n` + `🏆 *Top Usuários*:\n${topUsersText}\n\n` + `✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
    
    await nazu.sendMessage(from, { text: infoMessage, mentions: stats.topUsers.map(u => u.userId) }, { quoted: info });
    
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;
  
case 'infogp':
case 'dadosgp':
if (!isGroup) return reply("❌ Este comando só funciona em grupos!");
if(!isGroupAdmin) return reply("Somente admins.")
const target = from;
const targetId = target.split('@')[0];
try {
const meta = await nazu.groupMetadata(from);
const subject = meta.subject || "—";
const desc = meta.desc?.toString() || "Sem descrição";
const createdAt = meta.creation ? new Date(meta.creation * 1000).toLocaleString('pt-BR') : "Desconhecida";

const ownerJid = meta.owner || meta.participants.find(p => p.admin && p.isCreator)?.id || "unknown@s.whatsapp.net";
const ownerTag = `@${ownerJid.split('@')[0]}`;
const totalMembers = meta.participants.length;
const totalAdmins  = groupAdmins.length;

let profilePic;
try {
profilePic = await nazu.profilePictureUrl(meta.id, 'image');
} catch (error) {
profilePic = 'https://example.com/default_group_pic.png'; // Imagem de fallback
console.warn(`Falha ao obter foto do perfil do grupo ${meta.subject}:`, error.message);
}

const lines =
`╭───📊 STATUS DO GRUPO ───╮

*- Nome:* ${subject}

- ID: ${from.split('@')[0]}

*- Membros:* ${totalMembers}

*- Admins:* ${totalAdmins}

*- Desc:* ${desc}`;

await nazu.sendMessage(from, { image: { url: profilePic }, caption: lines, mentions: [ownerJid] }, { quoted: info });
} catch (e) {
console.error("Erro em statusgp:", e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
}
break;

case 'ping':
try {
const timestamp = Date.now();
const speedConverted = (timestamp - (info.messageTimestamp * 1000)) / 1000;

const uptimeBot = formatUptime(process.uptime(), true);
const uptimeSistema = formatUptime(os.uptime(), true);
  
const getGroups = await nazu.groupFetchAllParticipating();
const totalGrupos = Object.keys(getGroups).length;

const mensagem = `
🤖 *Informações e tempo ativo*
----
📛 Nome bot: ${nomebot}
⏱️ Tempo ativo: ${uptimeBot}
📶 Latência: ${speedConverted.toFixed(3)}s
`.trim();

await nazu.sendMessage(from, { image: { url: `./media/menu.jpg` }, caption: mensagem }, { quoted: info });

  } catch (e) {
    console.error("Erro no comando ping:", e);
    await reply("❌ Ocorreu um erro ao processar o comando ping");
  };
  break;
  
  case 'toimg':
  if(!isQuotedSticker) return reply('Por favor, *mencione um sticker* para executar o comando.');
  try {
  buff = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
  await nazu.sendMessage(from, {image: buff}, {quoted: info});
  } catch(error) {
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'qc': try {
  if(!q) return reply('Falta o texto.');
   let ppimg = "";
   try {
   ppimg = await nazu.profilePictureUrl(sender, 'image');
   } catch {
   ppimg = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg'
   };
  const json = {"type": "quote","format": "png","backgroundColor": "#FFFFFF","width": 512,"height": 768,"scale": 2,"messages": [{"entities": [],"avatar": true,"from": {"id": 1,"name": pushname,"photo": {"url": ppimg}},"text": q,"replyMessage": {}}]};
  res = await axios.post('https://bot.lyo.su/quote/generate', json, {headers: {'Content-Type': 'application/json'}});
  await sendSticker(nazu, from, { sticker: Buffer.from(res.data.result.image, 'base64'), author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image' }, {quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'emojimix': try {
  emoji1 = q.split(`/`)[0];emoji2 = q.split(`/`)[1];
  if(!q || !emoji1 || !emoji2) return reply(`Formato errado, utilize:\n${prefix}${command} emoji1/emoji2\nEx: ${prefix}${command} 🤓/🙄`);
  datzc = await emojiMix(emoji1, emoji2);
  await sendSticker(nazu, from, { sticker: {url: datzc}, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'ttp': try {
  if(!q) return reply('Cadê o texto?');
  cor = ["f702ff","ff0202","00ff2e","efff00","00ecff","3100ff","ffb400","ff00b0","00ff95","efff00"];
  fonte = ["Days%20One","Domine","Exo","Fredoka%20One","Gentium%20Basic","Gloria%20Hallelujah","Great%20Vibes","Orbitron","PT%20Serif","Pacifico"];
  cores = cor[Math.floor(Math.random() * (cor.length))];
  fontes = fonte[Math.floor(Math.random() * (fonte.length))];
  await sendSticker(nazu, from, { sticker: {url: `https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${q}&text.0.outline.color=000000&text.0.outline.blur=0&text.0.outline.opacity=55&text.0.color=${cores}&text.0.font.family=${fontes}&text.0.background.color=ff0000`}, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'brat': try {
  if(!q) return reply('falta o texto');
  await sendSticker(nazu, from, { sticker: {url: `https://api.cognima.com.br/api/image/brat?key=CognimaTeamFreeKey&texto=${encodeURIComponent(q)}`}, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  };
  break;
  
  case 'st':case 'stk':case 'sticker':case 's': try {
    var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image')
    await sendSticker(nazu, from, { sticker: buffer, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: isVideo2 ? 'video' : 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'st2':case 'stk2':case 'sticker2':case 's2': try {
    var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image')
    await sendSticker(nazu, from, { sticker: buffer, author: `『${pushname}』\n『${nomebot}』\n『${nomedono}』\n『cognima.com.br』`, packname: '👤 Usuario(a)ᮀ۟❁’￫\n🤖 Botᮀ۟❁’￫\n👑 Donoᮀ۟❁’￫\n🌐 Siteᮀ۟❁’￫', type: isVideo2 ? 'video' : 'image', forceSquare: true}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break

  case 'figualeatoria':case 'randomsticker': try {
    await nazu.sendMessage(from, { sticker: { url: `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp`}}, {quoted: info});
  } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'rename':case 'roubar': try {
   if(!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.')
   author = q.split(`/`)[0];packname = q.split(`/`)[1];
   if(!q || !author || !packname) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
   encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
   await sendSticker(nazu, from, { sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`, author: packname, packname: author, rename: true}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'rgtake': try {
  const [author, pack] = q.split('/');
  if (!q || !author || !pack) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
  const filePath = './dados/database/users/take.json';
  const dataTake = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
  dataTake[sender] = { author, pack };
  fs.writeFileSync(filePath, JSON.stringify(dataTake, null, 2), 'utf-8');
  reply(`Autor e pacote salvos com sucesso!\nAutor: ${author}\nPacote: ${pack}`);
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'take': try {
  if (!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.');
  const filePath = './dados/database/users/take.json';
  if (!fs.existsSync(filePath)) return reply('Nenhum autor e pacote salvos. Use o comando *rgtake* primeiro.');
  const dataTake = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!dataTake[sender]) return reply('Você não tem autor e pacote salvos. Use o comando *rgtake* primeiro.');
  const { author, pack } = dataTake[sender];
  const encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
  await sendSticker(nazu, from, { sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`, author: pack, packname: author, rename: true }, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;
  
  case 'mention':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!q) return reply(`📢 *Configuração de Marcações*\n\n🔧 Escolha como deseja ser mencionado:\n\n✅ *${prefix}mention all* → Marcado em tudo (marcações e jogos).\n📢 *${prefix}mention marca* → Apenas em marcações de administradores.\n🎮 *${prefix}mention games* → Somente em jogos do bot.\n🚫 *${prefix}mention 0* → Não será mencionado em nenhuma ocasião.`);
    let options = {  all: '✨ Você agora será mencionado em todas as interações do bot, incluindo marcações de administradores e os jogos!', marca: '📢 A partir de agora, você será mencionado apenas quando um administrador marcar.',games: '🎮 Você optou por ser mencionado somente em jogos do bot.', 0: '🔕 Silêncio ativado! Você não será mais mencionado pelo bot, nem em marcações nem em jogos.'};
    if (options[q.toLowerCase()] !== undefined) {
      if(!groupData.mark) groupData.mark = {};
      groupData.mark[sender] = q.toLowerCase();
      fs.writeFileSync(`./dados/database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
      return reply(`*${options[q.toLowerCase()]}*`);
    }

    reply(`❌ Opção inválida! Use *${prefix}mention* para ver as opções.`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'deletar': case 'delete': case 'del':  case 'd':
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if(!menc_prt) return reply("Marque uma mensagem.");
  let stanzaId, participant;
    if (info.message.extendedTextMessage) {
        stanzaId = info.message.extendedTextMessage.contextInfo.stanzaId;
        participant = info.message.extendedTextMessage.contextInfo.participant || menc_prt;
    } else if (info.message.viewOnceMessage) {
        stanzaId = info.key.id;
        participant = info.key.participant || menc_prt;
    };
    try {
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: stanzaId, participant: participant } });
    } catch (error) {
        reply("ocorreu um erro 💔");
    };
  break

 case 'blockuser':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    if (!menc_os2) return reply("Marque alguém 🙄");
    reason = q  ? q.includes('@')  ? q.includes(' ') ? q.split(' ').slice(1).join(' ')  : "Não informado" : q : 'Não informado';
    menc_os3 = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
    groupData.blockedUsers = groupData.blockedUsers || {};
    groupData.blockedUsers[menc_os3] = { reason, timestamp: Date.now() };
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Usuário @${menc_os3.split('@')[0]} bloqueado no grupo!\nMotivo: ${reason}`, { mentions: [menc_os3] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

  case 'unblockuser':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    if (!menc_os2) return reply("Marque alguém 🙄");
    if (!groupData.blockedUsers || (!groupData.blockedUsers[menc_os2] && !groupData.blockedUsers[menc_os2.split('@')[0]])) return reply(`❌ O usuário @${menc_os2.split('@')[0]} não está bloqueado no grupo!`, { mentions: [menc_os2] });
    if (!delete groupData.blockedUsers[menc_os2]) {
    delete groupData.blockedUsers[menc_os2.split('@')[0]];
    }
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Usuário @${menc_os2.split('@')[0]} desbloqueado no grupo!`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'listblocksgp':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    const blockedUsers = groupData.blockedUsers ? Object.entries(groupData.blockedUsers).map(([user, data]) => `👤 *${user.split('@')[0]}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum usuário bloqueado no grupo.';
    const message = `🔒 *Usuários Bloqueados no Grupo - ${groupName}* 🔒\n\n${blockedUsers}`;
    await reply(message);
  } catch (e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  }
  break;

  case 'banir':
  case 'ban':
  case 'b':
  case 'kick':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'remove');
    reply(`✅ Usuário banido com sucesso!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
    case 'linkgp':
    case 'linkgroup': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    linkgc = await nazu.groupInviteCode(from)
    await reply('https://chat.whatsapp.com/'+linkgc)
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break

  case 'promover':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'promote');
    reply(`✅ Usuário promovido a administrador!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'rebaixar':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'demote');
    reply(`✅ Usuário rebaixado com sucesso!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'setname':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const newName = q.trim();
    if (!newName) return reply('❌ Digite um novo nome para o grupo.');
    await nazu.groupUpdateSubject(from, newName);
    reply(`✅ Nome do grupo alterado para: *${newName}*`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'setdesc':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const newDesc = q.trim();
    if (!newDesc) return reply('❌ Digite uma nova descrição para o grupo.');
    await nazu.groupUpdateDescription(from, newDesc);
    reply(`✅ Descrição do grupo alterada!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'marcar':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
  try {
    let path = './dados/database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    if(!data.mark) data.mark = {};
    let membros = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));
    if (!membros.length) return reply('❌ Nenhum membro para mencionar.');
    let msg = `📢 *Membros mencionados:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
    await nazu.sendMessage(from, {text: msg + membros.map(m => `➤ @${m.split('@')[0]}`).join('\n'), mentions: membros});
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'grupo': case 'gp': try {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
  if(q.toLowerCase() === 'a' || q.toLowerCase() === 'abrir') {
  await nazu.groupSettingUpdate(from, 'not_announcement');
  await reply('Grupo aberto.');
  } else if(q.toLowerCase() === 'f' || q.toLowerCase() === 'fechar') {
  await nazu.groupSettingUpdate(from, 'announcement');
  await reply('Grupo fechado.');
  }} catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break
  
  case 'totag':
  case 'cita':
  case 'hidetag': try {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    
    var DFC4 = "";
    var rsm4 = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var pink4 = isQuotedImage ? rsm4?.imageMessage : info.message?.imageMessage;
    var blue4 = isQuotedVideo ? rsm4?.videoMessage : info.message?.videoMessage;
    var purple4 = isQuotedDocument ? rsm4?.documentMessage : info.message?.documentMessage;
    var yellow4 = isQuotedDocW ? rsm4?.documentWithCaptionMessage?.message?.documentMessage : info.message?.documentWithCaptionMessage?.message?.documentMessage;
    var aud_d4 = isQuotedAudio ? rsm4.audioMessage : "";
    var figu_d4 = isQuotedSticker ? rsm4.stickerMessage : "";
    var red4 = isQuotedMsg && !aud_d4 && !figu_d4 && !pink4 && !blue4 && !purple4 && !yellow4 ? rsm4.conversation : info.message?.conversation;
    var green4 = rsm4?.extendedTextMessage?.text || info?.message?.extendedTextMessage?.text;
    let path = './dados/database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    if(!data.mark) data.mark = {};
    var MRC_TD4 = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));

    if (pink4 && !aud_d4 && !purple4) {
        var DFC4 = pink4;
        pink4.caption = q.length > 1 ? q : pink4.caption.replace(new RegExp(prefix + command, "gi"), ` `);
        pink4.image = { url: pink4.url };
        pink4.mentions = MRC_TD4;
    } else if (blue4 && !aud_d4 && !purple4) {
        var DFC4 = blue4;
        blue4.caption = q.length > 1 ? q.trim() : blue4.caption.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        blue4.video = { url: blue4.url };
        blue4.mentions = MRC_TD4;
    } else if (red4 && !aud_d4 && !purple4) {
        var black4 = {};
        black4.text = red4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        black4.mentions = MRC_TD4;
        var DFC4 = black4;
    } else if (!aud_d4 && !figu_d4 && green4 && !purple4) {
        var brown4 = {};
        brown4.text = green4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        brown4.mentions = MRC_TD4;
        var DFC4 = brown4;
    } else if (purple4) {
        var DFC4 = purple4;
        purple4.document = { url: purple4.url };
        purple4.mentions = MRC_TD4;
    } else if (yellow4 && !aud_d4) {
        var DFC4 = yellow4;
        yellow4.caption = q.length > 1 ? q.trim() : yellow4.caption.replace(new RegExp(prefix + command, "gi"), `${pushname}\n\n`).trim();
        yellow4.document = { url: yellow4.url };
        yellow4.mentions = MRC_TD4;
    } else if (figu_d4 && !aud_d4) {
        var DFC4 = figu_d4;
        figu_d4.sticker = { url: figu_d4.url };
        figu_d4.mentions = MRC_TD4;
    } else if (aud_d4) {
        var DFC4 = aud_d4;
        aud_d4.audio = { url: aud_d4.url };
        aud_d4.mentions = MRC_TD4;
        aud_d4.ptt = true;
    };
    await nazu.sendMessage(from, DFC4).catch((error) => {});
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break;

   case 'antilinkhard':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antilinkhard = !groupData.antilinkhard;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antilinkhard ${groupData.antilinkhard ? 'ativado' : 'desativado'}! Qualquer link enviado resultará em banimento.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'autodl':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    groupData.autodl = !groupData.autodl;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Autodl ${groupData.autodl ? 'ativado' : 'desativado'}! Links suportados serão baixados automaticamente.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'cmdlimit':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!q) return reply(`Digite o limite de comandos por dia ou "off" para desativar.\nExemplo: `+prefix+`cmdlimit 10`);
    cmdLimitData[from] = cmdLimitData[from] || { users: {} };
    if (q.toLowerCase() === 'off') {
      cmdLimitData[from].enabled = false;
      delete cmdLimitData[from].limit;
    } else {
      const limit = parseInt(q);
      if (isNaN(limit) || limit < 1) return reply('Limite inválido! Use um número maior que 0 ou "off".');
      cmdLimitData[from].enabled = true;
      cmdLimitData[from].limit = limit;
    }
    fs.writeFileSync('./dados/database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
    await reply(`✅ Limite de comandos ${cmdLimitData[from].enabled ? `definido para ${cmdLimitData[from].limit} por dia` : 'desativado'}!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antipt':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antipt = !groupData.antipt;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ AntiPT ${groupData.antipt ? 'ativado' : 'desativado'}! Membros de Portugal serão banidos.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
 case 'antifake':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antifake = !groupData.antifake;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antifake ${groupData.antifake ? 'ativado' : 'desativado'}! Membros de fora do Brasil/Portugal serão banidos.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'antidoc':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antidoc = !groupData.antidoc;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antidoc ${groupData.antidoc ? 'ativado' : 'desativado'}! Documentos enviados resultarão em banimento.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'x9':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    groupData.x9 = !groupData.x9;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Modo X9 ${groupData.x9 ? 'ativado' : 'desativado'}! Agora eu aviso sobre promoções e rebaixamentos.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'antiflood':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!q) return reply(`Digite o intervalo em segundos ou "off" para desativar.\nExemplo: `+prefix+`antiflood 5`);
    antifloodData[from] = antifloodData[from] || { users: {} };
    if (q.toLowerCase() === 'off') {
      antifloodData[from].enabled = false;
      delete antifloodData[from].interval;
    } else {
      const interval = parseInt(q);
      if (isNaN(interval) || interval < 1) return reply('Intervalo inválido! Use um número maior que 0 ou "off".');
      antifloodData[from].enabled = true;
      antifloodData[from].interval = interval;
    }
    fs.writeFileSync('./dados/database/antiflood.json', JSON.stringify(antifloodData, null, 2));
    await reply(`✅ Antiflood ${antifloodData[from].enabled ? `ativado com intervalo de ${antifloodData[from].interval} segundos` : 'desativado'}!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

 case 'antiloc':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antiloc = !groupData.antiloc;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antiloc ${groupData.antiloc ? 'ativado' : 'desativado'}! Localizações enviadas resultarão em banimento.`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
    case 'modobrincadeira': case 'modobrincadeiras': case 'modobn': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    if (!groupData.modobrincadeira || groupData.modobrincadeira === undefined) {
        groupData.modobrincadeira = true;
    } else {
        groupData.modobrincadeira = !groupData.modobrincadeira;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.modobrincadeira) {
        await reply('🎉 *Modo de Brincadeiras ativado!* Agora o grupo está no modo de brincadeiras. Divirta-se!');
    } else {
        await reply('⚠️ *Modo de Brincadeiras desativado!* O grupo não está mais no modo de brincadeiras.');
    }} catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break;
    
    case 'bemvindo': case 'bv': case 'boasvindas': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;   
    if (!groupData.bemvindo || groupData.bemvindo === undefined) {
        groupData.bemvindo = true;
    } else {
        groupData.bemvindo = !groupData.bemvindo;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.bemvindo) {
        await reply(`✅ *Boas-vindas ativadas!* Agora, novos membros serão recebidos com uma mensagem personalizada.\n📝 Para configurar a mensagem, use: *${prefixo}legendabv*`);
    } else {
        await reply('⚠️ *Boas-vindas desativadas!* O grupo não enviará mais mensagens para novos membros.');
    }} catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
    break;
    
   case 'fotobv':
   case 'welcomeimg': {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  if (!isQuotedImage && !isImage) return reply('❌ Marque uma imagem ou envie uma imagem com o comando!');

  try {
      const imgMessage = isQuotedImage
        ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
        : info.message.imageMessage;
      const media = await getFileBuffer(imgMessage, 'image');
      const uploadResult = await upload(media);
      if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
      if (!groupData.welcome) groupData.welcome = {};
      groupData.welcome.image = uploadResult;
      fs.writeFileSync(`./dados/database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
    await reply('✅ Foto de boas-vindas configurada com sucesso!');
  } catch (error) {
    console.error(error);
    reply("ocorreu um erro 💔");
  }
}
break;

   case 'fotosaida': case 'fotosaiu': case 'imgsaiu': case 'exitimg': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     if (!isQuotedImage && !isImage) return reply('❌ Marque uma imagem ou envie uma imagem com o comando!');
     try {
       const media = await getFileBuffer(
         isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage,
         'image'
       );
       const uploadResult = await upload(media);
       if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.image = uploadResult;
       fs.writeFileSync(`./dados/database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply('✅ Foto de saída configurada com sucesso!');
     } catch (error) {
       console.error(error);
       reply("ocorreu um erro 💔");
     };
   };
   break;
 
   case 'limpar':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    const linhasEmBranco = Array(500).fill('‎ ').join('\n');
    const mensagem = `${linhasEmBranco}\n🧹 Limpeza concluída!`;
    await reply(mensagem);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao limpar o chat 💔");
  }
  break;

case 'removerfotobv': case 'rmfotobv': case 'delfotobv':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { welcome: {} };
    if (!groupData.welcome?.image) return reply("❌ Não há imagem de boas-vindas configurada.");
    delete groupData.welcome.image;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply("✅ A imagem de boas-vindas foi removida com sucesso!");
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'removerfotosaiu': case 'rmfotosaiu': case 'delfotosaiu':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { exit: {} };
    if (!groupData.exit?.image) return reply("❌ Não há imagem de saída configurada.");
    delete groupData.exit.image;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply("✅ A imagem de saída foi removida com sucesso!");
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
   case 'configsaida': case 'textsaiu': case 'legendasaiu': case 'exitmsg': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     if (!q) return reply(`📝 Para configurar a mensagem de saída, use:\n${prefix}${command} <mensagem>\n\nVocê pode usar:\n#numerodele# - Menciona quem saiu\n#nomedogp# - Nome do grupo\n#membros# - Total de membros\n#desc# - Descrição do grupo`);
     try {
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.enabled = true;
       groupData.exit.text = q;
       fs.writeFileSync(`./dados/database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply('✅ Mensagem de saída configurada com sucesso!\n\n📝 Mensagem definida como:\n' + q);
     } catch (error) {
       console.error(error);
       await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
     }
   }
   break;

   case 'saida': case 'exit': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     try {
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.enabled = !groupData.exit.enabled;
       fs.writeFileSync(`./dados/database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply(groupData.exit.enabled ? '✅ Mensagens de saída ativadas!' : '❌ Mensagens de saída desativadas!');
     } catch (error) {
       console.error(error);
       await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
     };
   };
   break;

  case 'addblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (groupData.blacklist[menc_os2]) return reply("❌ Este usuário já está na blacklist.");
    groupData.blacklist[menc_os2] = { reason, timestamp: Date.now() };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ @${menc_os2.split('@')[0]} foi adicionado à blacklist.\nMotivo: ${reason}`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'delblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (!groupData.blacklist[menc_os2]) return reply("❌ Este usuário não está na blacklist.");
    delete groupData.blacklist[menc_os2];
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ @${menc_os2.split('@')[0]} foi removido da blacklist.`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'listblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (Object.keys(groupData.blacklist).length === 0) return reply("📋 A blacklist está vazia.");
    let text = "📋 *Lista de Usuários na Blacklist*\n\n";
    for (const [user, data] of Object.entries(groupData.blacklist)) {
      text += `👤 @${user.split('@')[0]}\n📝 Motivo: ${data.reason}\n🕒 Adicionado em: ${new Date(data.timestamp).toLocaleString()}\n\n`;
    }
    reply(text, { mentions: Object.keys(groupData.blacklist) });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'adv':
case 'advertir':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    if (menc_os2 === botNumber) return reply("❌ Não posso advertir a mim mesma!");
    const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    groupData.warnings[menc_os2] = groupData.warnings[menc_os2] || [];
    groupData.warnings[menc_os2].push({
      reason,
      timestamp: Date.now(),
      issuer: sender
    });
    const warningCount = groupData.warnings[menc_os2].length;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    if (warningCount >= 3) {
      await nazu.groupParticipantsUpdate(from, [menc_os2], 'remove');
      delete groupData.warnings[menc_os2];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
      reply(`🚫 @${menc_os2.split('@')[0]} recebeu 3 advertências e foi banido!\nÚltima advertência: ${reason}`, { mentions: [menc_os2] });
    } else {
      reply(`⚠️ @${menc_os2.split('@')[0]} recebeu uma advertência (${warningCount}/3).\nMotivo: ${reason}`, { mentions: [menc_os2] });
    }
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'removeradv': case 'rmadv':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    if (!groupData.warnings[menc_os2] || groupData.warnings[menc_os2].length === 0) return reply("❌ Este usuário não tem advertências.");
    groupData.warnings[menc_os2].pop();
    if (groupData.warnings[menc_os2].length === 0) delete groupData.warnings[menc_os2];
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ Uma advertência foi removida de @${menc_os2.split('@')[0]}. Advertências restantes: ${groupData.warnings[menc_os2]?.length || 0}/3`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'listadv':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    if (Object.keys(groupData.warnings).length === 0) return reply("📋 Não há advertências ativas no grupo.");
    let text = "📋 *Lista de Advertências*\n\n";
    for (const [user, warnings] of Object.entries(groupData.warnings)) {
      text += `👤 @${user.split('@')[0]} (${warnings.length}/3)\n`;
      warnings.forEach((warn, index) => {
        text += `  ${index + 1}. Motivo: ${warn.reason}\n`;
        text += `     Por: @${warn.issuer.split('@')[0]}\n`;
        text += `     Em: ${new Date(warn.timestamp).toLocaleString()}\n`;
      });
      text += "\n";
    }
    reply(text, { mentions: [...Object.keys(groupData.warnings), ...Object.values(groupData.warnings).flatMap(w => w.map(warn => warn.issuer))] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

    case 'soadm': case 'onlyadm': case 'soadmin': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;   
    if (!groupData.soadm || groupData.soadm === undefined) {
        groupData.soadm = true;
    } else {
        groupData.soadm = !groupData.soadm;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.soadm) {
        await reply(`✅ *Modo apenas adm ativado!* Agora apenas administrdores do grupo poderam utilizar o bot*`);
    } else {
        await reply('⚠️ *Modo apenas adm desativado!* Agora todos os membros podem utilizar o bot novamente.');
    }} catch(e) {
    console.error(e);
    reply("ocorreu um erro 💔");
    };
    break;
    
    case 'modolite': try {
      if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
      if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
      
      const groupFilePath = `./dados/database/grupos/${from}.json`;
      
      if (!groupData.modolite) {
          groupData.modolite = true;
          if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
          }
      } else {
          groupData.modolite = !groupData.modolite;
          if (!groupData.modolite) {
              groupData.modoliteOff = true;
          } else if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
          }
      }
      
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
      
      if (groupData.modolite) {
          await reply('👶 *Modo Lite ativado!* O conteúdo inapropriado para crianças será filtrado neste grupo.');
      } else {
          await reply('🔞 *Modo Lite desativado!* O conteúdo do menu de brincadeiras será exibido completamente.');
      }
    } catch(e) {
      console.error(e);
      await reply("Ocorreu um erro 💔");
    }
    break;
    
    case 'modoliteglobal': try {
      if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
      
      const modoLiteFile = './dados/database/modolite.json';
      
      modoLiteGlobal.status = !modoLiteGlobal.status;

      if (!modoLiteGlobal.status) {
        modoLiteGlobal.forceOff = true;
      } else if (modoLiteGlobal.hasOwnProperty('forceOff')) {
        delete modoLiteGlobal.forceOff;
      }
      
      fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
      
      if (modoLiteGlobal.status) {
        await reply('👶 *Modo Lite ativado globalmente!* O conteúdo inapropriado para crianças será filtrado em todos os grupos (a menos que seja explicitamente desativado em algum grupo).');
      } else {
        await reply('🔞 *Modo Lite desativado globalmente!* O conteúdo do menu de brincadeiras será exibido completamente (a menos que seja explicitamente ativado em algum grupo).');
      }
    } catch(e) {
      console.error(e);
      await reply("Ocorreu um erro 💔");
    }
    break;
    
    case 'antilinkgp':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antilinkgp: false };
    groupData.antilinkgp = !groupData.antilinkgp;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antilinkgp ? `✅ *Antilinkgp foi ativado com sucesso!*\n\nAgora, se alguém enviar links de outros grupos, será banido automaticamente. Mantenha o grupo seguro! 🛡️` : `✅ *Antilinkgp foi desativado.*\n\nLinks de outros grupos não serão mais bloqueados. Use com cuidado! ⚠️`;
     reply(`${message}`);
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'antiporn':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antiporn: false };
    groupData.antiporn = !groupData.antiporn;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antiporn ? `✅ *Antiporn foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo adulto (NSFW), será banido automaticamente. Mantenha o grupo seguro e adequado! 🛡️` : `✅ *Antiporn foi desativado.*\n\nConteúdo adulto não será mais bloqueado. Use com responsabilidade! ⚠️`;
    reply(`${message}`);
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'autosticker':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
    groupData.autoSticker = !groupData.autoSticker;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ Auto figurinhas ${groupData.autoSticker ? 'ativadas' : 'desativadas'}! ${groupData.autoSticker ? 'Todas as imagens e vídeos serão convertidos em figurinhas.' : ''}`);
   } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
   }
   break;
  
    case 'antigore':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antigore: false };
    groupData.antigore = !groupData.antigore;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antigore ? `✅ *Antigore foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo gore, será banido automaticamente. Mantenha o grupo seguro e saudável! 🛡️` : `✅ *Antigore foi desativado.*\n\nConteúdo gore não será mais bloqueado. Use com cuidado! ⚠️`;
    reply(`${message}`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
    case 'modonsfw':
    case 'modo+18':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { nsfwMode: false };
    groupData.nsfwMode = !groupData.nsfwMode;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.nsfwMode) {
      await nazu.sendMessage(from, {text: `🔞 *Modo +18 ativado!*`,}, { quoted: info });
    } else {
      await nazu.sendMessage(from, {text: `✅ *Modo +18 desativado!.*`,}, { quoted: info });
    }
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'legendabv': case 'textbv': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    if (!q) return reply(`📝 *Configuração da Mensagem de Boas-Vindas*\n\nPara definir uma mensagem personalizada, digite o comando seguido do texto desejado. Você pode usar as seguintes variáveis:\n\n- *#numerodele#* → Marca o novo membro.\n- *#nomedogp#* → Nome do grupo.\n- *#desc#* → Descrição do grupo.\n- *#membros#* → Número total de membros no grupo.\n\n📌 *Exemplo:*\n${prefixo}legendabv Bem-vindo(a) #numerodele# ao grupo *#nomedogp#*! Agora somos #membros# membros. Leia a descrição: #desc#`);
    groupData.textbv = q;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    reply(`✅ *Mensagem de boas-vindas configurada com sucesso!*\n\n📌 Nova mensagem:\n"${groupData.textbv}"`);
    } catch(e) {
    console.error(e);
    await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
    };
  break;
  
  case 'mute':
  case 'mutar':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { mutedUsers: {} };
    groupData.mutedUsers = groupData.mutedUsers || {};
    groupData.mutedUsers[menc_os2] = true;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi mutado. Se enviar mensagens, será banido.`, mentions: [menc_os2] }, { quoted: info });
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'desmute':
  case 'desmutar':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { mutedUsers: {} };
    groupData.mutedUsers = groupData.mutedUsers || {};
    if (groupData.mutedUsers[menc_os2]) {
      delete groupData.mutedUsers[menc_os2];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
      await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi desmutado e pode enviar mensagens novamente.`, mentions: [menc_os2]}, { quoted: info });
    } else {
      reply('❌ Este usuário não está mutado.');
    }
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'blockcmd':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!q) return reply(`❌ Digite o comando que deseja bloquear. Exemplo: ${prefix}blockcmd sticker`);
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blockedCommands: {} };
    groupData.blockedCommands = groupData.blockedCommands || {};
    groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')] = true;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    reply(`✅ O comando *${q.trim()}* foi bloqueado e só pode ser usado por administradores.`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
  case 'unblockcmd':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!q) return reply(`❌ Digite o comando que deseja desbloquear. Exemplo: ${prefix}unblockcmd sticker`);
    const groupFilePath = `./dados/database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blockedCommands: {} };
    groupData.blockedCommands = groupData.blockedCommands || {};
    if (groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')]) {
      delete groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
      reply(`✅ O comando *${q.trim()}* foi desbloqueado e pode ser usado por todos.`);
    } else {
      reply('❌ Este comando não está bloqueado.');
    }
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

    case 'ttt': case 'jogodavelha': {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const result = await tictactoe.invitePlayer(from, sender, menc_os2);
    await nazu.sendMessage(from, {
        text: result.message,
        mentions: result.mentions
    });
    break;
   };
   
   case 'chance':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply(`Digite algo para eu calcular a chance! Exemplo: ${prefix}chance chover hoje`);
    const chance = Math.floor(Math.random() * 101);
    await reply(`📊 A chance de "${q}" acontecer é: *${chance}%*!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'quando':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply('Digite algo para eu prever quando vai acontecer! Exemplo: '+prefix+'quando vou ficar rico');
    const tempos = ['hoje', 'amanhã', 'na próxima semana', 'no próximo mês', 'no próximo ano', 'nunca'];
    const tempo = tempos[Math.floor(Math.random() * tempos.length)];
    await reply(`🕒 "${q}" vai acontecer: *${tempo}*!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'casal':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
    let path = './dados/database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    const membro1 = membros[Math.floor(Math.random() * membros.length)];
    let membro2 = membros[Math.floor(Math.random() * membros.length)];
    while (membro2 === membro1) {
      membro2 = membros[Math.floor(Math.random() * membros.length)];
    };
    const shipLevel = Math.floor(Math.random() * 101);
    const chance = Math.floor(Math.random() * 101);
    await reply(`💕 *Casal do momento* 💕\n@${membro1.split('@')[0]} + @${membro2.split('@')[0]}\n\n🌟 Nível de ship: *${shipLevel}%*\n🎯 Chance de dar certo: *${chance}%*`, { mentions: [membro1, membro2] });
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'shipo':
   try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!menc_os2) return reply('Marque alguém para eu encontrar um par! Exemplo: '+prefix+'shipo @fulano');
    if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
    let path = './dados/database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    let par = membros[Math.floor(Math.random() * membros.length)];
    while (par === menc_os2) {
      par = membros[Math.floor(Math.random() * membros.length)];
    };
    const shipLevel = Math.floor(Math.random() * 101);
    const chance = Math.floor(Math.random() * 101);
    await reply(`💞 *Ship perfeito* 💞\n@${menc_os2.split('@')[0]} + @${par.split('@')[0]}\n\n🌟 Nível de ship: *${shipLevel}%*\n🎯 Chance de dar certo: *${chance}%*`, { mentions: [menc_os2, par] });
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'sn':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply('Faça uma pergunta! Exemplo: '+prefix+'sn Vou ganhar na loteria?');
    const resposta = Math.random() > 0.5 ? 'Sim' : 'Não';
    await reply(`🎯 ${resposta}!`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'admins': case 'admin': case 'adm': case 'adms':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  try {
    let membros = groupAdmins;
    let msg = `📢 *Mencionando os admins do grupo:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
    await nazu.sendMessage(from, {text: msg + membros.map(m => `➤ @${m.split('@')[0]}`).join('\n'), mentions: membros});
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'perfil':
  try {
    const target = sender;

    const targetId = target.split('@')[0];
    const targetName = `@${targetId}`;

    const levels = {
      puta: Math.floor(Math.random() * 101),
      gado: Math.floor(Math.random() * 101),
      corno: Math.floor(Math.random() * 101),
      sortudo: Math.floor(Math.random() * 101),
      carisma: Math.floor(Math.random() * 101),
      rico: Math.floor(Math.random() * 101),
      gostosa: Math.floor(Math.random() * 101),
      feio: Math.floor(Math.random() * 101)
    };

    const pacoteValue = `R$ ${(Math.random() * 10000 + 1).toFixed(2).replace('.', ',')}`;

    const humors = ['😎 Tranquilão', '🔥 No fogo', '😴 Sonolento', '🤓 Nerd mode', '😜 Loucura total', '🧘 Zen'];
    const randomHumor = humors[Math.floor(Math.random() * humors.length)];

    let profilePic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
    try {
      profilePic = await nazu.profilePictureUrl(target, 'image');
    } catch (error) {
      console.warn(`Falha ao obter foto do perfil de ${targetName}:`, error.message);
    }

    let bio = 'Sem bio disponível';
    let bioSetAt = '';
    try {
      const statusData = await nazu.fetchStatus(target);
      const status = statusData?.[0]?.status;
      if (status) {
        bio = status.status || bio;
        bioSetAt = new Date(status.setAt).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
      };
    } catch (error) {
      console.warn(`Falha ao obter status/bio de ${targetName}:`, error.message);
    };

    const perfilText = `📋 Perfil de ${targetName} 📋\n\n👤 *Nome*: ${pushname || 'Desconhecido'}\n📱 *Número*: ${targetId}\n📜 *Bio*: ${bio}${bioSetAt ? `\n🕒 *Bio atualizada em*: ${bioSetAt}` : ''}\n💰 *Valor do Pacote*: ${pacoteValue} 🫦\n😸 *Humor*: ${randomHumor}\n\n🎭 *Níveis*:\n  • Puta: ${levels.puta}%\n  • Gado: ${levels.gado}%\n  • Corno: ${levels.corno}%\n  • Sortudo: ${levels.sortudo}%\n  • Carisma: ${levels.carisma}%\n  • Rico: ${levels.rico}%\n  • Gostosa: ${levels.gostosa}%\n  • Feio: ${levels.feio}%`.trim();
    
    const userStatus = isOwner ? 'Meu dono' : isPremium ? 'Usuario premium' : isGroupAdmin ? 'Admin do grupo' : 'Membro comum';
    
    const PosAtivo = groupData.contador.sort((a, b) => ((a.figu == undefined ? a.figu = 0 : a.figu + a.msg + a.cmd) < (b.figu == undefined ? b.figu = 0 : b.figu + b.cmd + b.msg)) ? 0 : -1).findIndex(item => item.id === sender) + 1;
    
    const card = await new Banner.discordProfile().setUsername(pushname).setAvatar(profilePic).setDiscriminator(String(PosAtivo)+' RankAtivo').setCustomField('BIOGRAFIA', bio).setCustomField('CARGO', userStatus).setBanner('https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1750259175074_ftrfhj.bin').setStatus('online').build();
    
    await nazu.sendMessage(from, { image: card, caption: perfilText, mentions: [target] }, { quoted: info });
  } catch (error) {
    console.error('Erro ao processar comando perfil:', error);
    await reply('Ocorreu um erro ao gerar o perfil 💔');
  }
  break;
  
  case 'ppt':
  try {
    if (!q) return reply('Escolha: pedra, papel ou tesoura! Exemplo: '+prefix+'ppt pedra');
    const escolhas = ['pedra', 'papel', 'tesoura'];
    if (!escolhas.includes(q.toLowerCase())) return reply('Escolha inválida! Use: pedra, papel ou tesoura.');
    const botEscolha = escolhas[Math.floor(Math.random() * 3)];
    const usuarioEscolha = q.toLowerCase();
    let resultado;
    if (usuarioEscolha === botEscolha) {
      resultado = 'Empate! 🤝';
    } else if (
      (usuarioEscolha === 'pedra' && botEscolha === 'tesoura') ||
      (usuarioEscolha === 'papel' && botEscolha === 'pedra') ||
      (usuarioEscolha === 'tesoura' && botEscolha === 'papel')
    ) {
      resultado = 'Você ganhou! 🎉';
    } else {
      resultado = 'Eu ganhei! 😎';
    }
    await reply(`🖐️ *Pedra, Papel, Tesoura* 🖐️\n\nVocê: ${usuarioEscolha}\nEu: ${botEscolha}\n\n${resultado}`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
   case 'eununca': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    await nazu.sendMessage(from, {poll: {name: toolsJson().iNever[Math.floor(Math.random() * toolsJson().iNever.length)],values: ["Eu nunca", "Eu ja"], selectableCount: 1}, messageContextInfo: { messageSecret: Math.random()}}, {from, options: {userJid: nazu?.user?.id}})
   } catch(e) {
   console.error(e);
   await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
   };
   break
   
   case 'vab': try {
   if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
   if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
   const vabs = vabJson()[Math.floor(Math.random() * vabJson().length)];
   await nazu.sendMessage(from, {poll: {name: 'O que você prefere?',values: [vabs.option1, vabs.option2], selectableCount: 1}, messageContextInfo: { messageSecret: Math.random()}}, {from, options: {userJid: nazu?.user?.id}})
   } catch(e) {
   console.error(e);
   await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
   };
   break
   
   case 'surubao': case 'suruba': try {
   if (isModoLite) return nazu.react('❌');
   if(!isGroup) return reply(`Apenas em grupos`);
   if(!isModoBn) return reply('O modo brincadeira nao esta ativo no grupo')
   if (!q) return reply(`Eita, coloque o número de pessoas após o comando.`)
   if (Number(q) > 15) return reply("Coloque um número menor, ou seja, abaixo de *15*.")
   emojiskk = ["🥵", "😈", "🫣", "😏"];
   emojis2 = emojiskk[Math.floor(Math.random() * emojiskk.length)];
   frasekk = [`tá querendo relações sexuais a ${q}, topa?`, `quer que *${q}* pessoas venham de *chicote, algema e corda de alpinista*.`, `quer que ${q} pessoas der tapa na cara, lhe chame de cachorra e fud3r bem gostosinho...`]
   let path = './dados/database/grupos/' + from + '.json';
   let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
   let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
   context = frasekk[Math.floor(Math.random() * frasekk.length)]  
   ABC = `${emojis2} @${sender.split('@')[0]} ${context}\n\n`
   mencts = [sender];
   for (var i = 0; i < q; i++) {
   menb = membros[Math.floor(Math.random() * membros.length)];
   ABC += `@${menb.split("@")[0]}\n`;
   mencts.push(menb);
  };
  await nazu.sendMessage(from, {image: {url: 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747545773146_rrv7of.bin'}, caption: ABC, mentions: mencts});
  } catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

case 'suicidio': try {
await reply(`*É uma pena que tenha tomado essa decisão ${pushname}, vamos sentir saudades... 😕*`)
setTimeout(async() => { 
await nazu.groupParticipantsUpdate(from, [sender], "remove")  
}, 2000)
setTimeout(async() => {
await reply(`*Ainda bem que morreu, não aguentava mais essa praga kkkkkk*`)
}, 3000)
} catch(e) {
  console.error(e);
  await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
  };
  break;

   case 'gay': case 'burro': case 'inteligente': case 'otaku': case 'fiel': case 'infiel': case 'corno':  case 'gado': case 'gostoso': case 'feio': case 'rico': case 'pobre': case 'pirocudo': case 'pirokudo': case 'nazista': case 'ladrao': case 'safado': case 'vesgo': case 'bebado': case 'machista': case 'homofobico': case 'racista': case 'chato': case 'sortudo': case 'azarado': case 'forte': case 'fraco': case 'pegador': case 'otario': case 'macho': case 'bobo': case 'nerd': case 'preguicoso': case 'trabalhador': case 'brabo': case 'lindo': case 'malandro': case 'simpatico': case 'engracado': case 'charmoso': case 'misterioso': case 'carinhoso': case 'desumilde': case 'humilde': case 'ciumento': case 'corajoso': case 'covarde': case 'esperto': case 'talarico': case 'chorao': case 'brincalhao': case 'bolsonarista': case 'petista': case 'comunista': case 'lulista': case 'traidor': case 'bandido': case 'cachorro': case 'vagabundo': case 'pilantra': case 'mito': case 'padrao': case 'comedia': case 'psicopata': case 'fortao': case 'magrelo': case 'bombado': case 'chefe': case 'presidente': case 'rei': case 'patrao': case 'playboy': case 'zueiro': case 'gamer': case 'programador': case 'visionario': case 'billionario': case 'poderoso': case 'vencedor': case 'senhor': try {
    if (isModoLite && ['pirocudo', 'pirokudo', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    let gamesData = fs.existsSync('./dados/src/funcs/json/games.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/games.json')) : { games: {} };
    const target = menc_os2 ? menc_os2 : sender;
    const targetName = `@${target.split('@')[0]}`;
    const level = Math.floor(Math.random() * 101);
    let responses = fs.existsSync('./dados/src/funcs/json/gamestext.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/gamestext.json')) : {};
    const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
    const media = gamesData.games[command]
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true});
    } else {
        await nazu.sendMessage(from, {text: responseText, mentions: [target]});
    };
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

   case 'lesbica': case 'burra': case 'inteligente': case 'otaku': case 'fiel': case 'infiel': case 'corna': case 'gado': case 'gostosa': case 'feia': case 'rica': case 'pobre': case 'bucetuda': case 'nazista': case 'ladra': case 'safada': case 'vesga': case 'bebada': case 'machista': case 'homofobica': case 'racista': case 'chata': case 'sortuda': case 'azarada': case 'forte': case 'fraca': case 'pegadora': case 'otaria': case 'boba': case 'nerd': case 'preguicosa': case 'trabalhadora': case 'braba': case 'linda': case 'malandra': case 'simpatica': case 'engracada': case 'charmosa': case 'misteriosa': case 'carinhosa': case 'desumilde': case 'humilde': case 'ciumenta': case 'corajosa': case 'covarde': case 'esperta': case 'talarica': case 'chorona': case 'brincalhona': case 'bolsonarista': case 'petista': case 'comunista': case 'lulista': case 'traidora': case 'bandida': case 'cachorra': case 'vagabunda': case 'pilantra': case 'mito': case 'padrao': case 'comedia': case 'psicopata': case 'fortona': case 'magrela': case 'bombada': case 'chefe': case 'presidenta': case 'rainha': case 'patroa': case 'playboy': case 'zueira': case 'gamer': case 'programadora': case 'visionaria': case 'bilionaria': case 'poderosa': case 'vencedora': case 'senhora': try {
    if (isModoLite && ['bucetuda', 'cachorra', 'vagabunda', 'racista', 'nazista', 'gostosa', 'machista', 'homofobica'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    let gamesData = fs.existsSync('./dados/src/funcs/json/games.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/games.json')) : { games: {} };
    const target = menc_os2 ? menc_os2 : sender;
    const targetName = `@${target.split('@')[0]}`;
    const level = Math.floor(Math.random() * 101);
    let responses = fs.existsSync('./dados/src/funcs/json/gamestext2.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/gamestext2.json')) : {};
    const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
    const media = gamesData.games[command]
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true});
    } else {
        await nazu.sendMessage(from, {text: responseText, mentions: [target]});
    };
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

case 'rankgay': case 'rankburro': case 'rankinteligente': case 'rankotaku': case 'rankfiel': case 'rankinfiel': case 'rankcorno': case 'rankgado': case 'rankgostoso': case 'rankrico': case 'rankpobre': case 'rankforte': case 'rankpegador': case 'rankmacho': case 'ranknerd': case 'ranktrabalhador': case 'rankbrabo': case 'ranklindo': case 'rankmalandro': case 'rankengracado': case 'rankcharmoso': case 'rankvisionario': case 'rankpoderoso': case 'rankvencedor':case 'rankgays': case 'rankburros': case 'rankinteligentes': case 'rankotakus': case 'rankfiels': case 'rankinfieis': case 'rankcornos': case 'rankgados': case 'rankgostosos': case 'rankricos': case 'rankpobres': case 'rankfortes': case 'rankpegadores': case 'rankmachos': case 'ranknerds': case 'ranktrabalhadores': case 'rankbrabos': case 'ranklindos': case 'rankmalandros': case 'rankengracados': case 'rankcharmosos': case 'rankvisionarios': case 'rankpoderosos': case 'rankvencedores': try {
   if (isModoLite && ['rankgostoso', 'rankgostosos', 'ranknazista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    let path = './dados/database/grupos/' + from + '.json';
    let gamesData = fs.existsSync('./dados/src/funcs/json/games.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/games.json')) : { ranks: {} };
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
    let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
    let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
    let ranksData = fs.existsSync('./dados/src/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/ranks.json')) : { ranks: {} };
    let responseText = ranksData[cleanedCommand] || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
    top5.forEach((m, i) => {
        responseText += `🏅 *#${i + 1}* - @${m.split('@')[0]}\n`;
    });
    let media = gamesData.ranks[cleanedCommand];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: top5 });
    }
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

case 'ranklesbica': case 'rankburra': case 'rankinteligente': case 'rankotaku': case 'rankfiel': case 'rankinfiel': case 'rankcorna': case 'rankgada': case 'rankgostosa': case 'rankrica': case 'rankpobre': case 'rankforte': case 'rankpegadora': case 'ranknerd': case 'ranktrabalhadora': case 'rankbraba': case 'ranklinda': case 'rankmalandra': case 'rankengracada': case 'rankcharmosa': case 'rankvisionaria': case 'rankpoderosa': case 'rankvencedora':case 'ranklesbicas': case 'rankburras': case 'rankinteligentes': case 'rankotakus': case 'rankfiels': case 'rankinfieis': case 'rankcornas': case 'rankgads': case 'rankgostosas': case 'rankricas': case 'rankpobres': case 'rankfortes': case 'rankpegadoras': case 'ranknerds': case 'ranktrabalhadoras': case 'rankbrabas': case 'ranklindas': case 'rankmalandras': case 'rankengracadas': case 'rankcharmosas': case 'rankvisionarias': case 'rankpoderosas': case 'rankvencedoras': try {
    if (isModoLite && ['rankgostosa', 'rankgostosas', 'ranknazista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    let path = './dados/database/grupos/' + from + '.json';
    let gamesData = fs.existsSync('./dados/src/funcs/json/games.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/games.json')) : { ranks: {} };
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
    let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
    let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
    let ranksData = fs.existsSync('./dados/src/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/ranks.json')) : { ranks: {} };
    let responseText = ranksData[cleanedCommand]+'\n\n' || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
    top5.forEach((m, i) => {
        responseText += `🏅 *#${i + 1}* - @${m.split('@')[0]}\n`;
    });
    let media = gamesData.ranks[cleanedCommand];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: top5 });
    }
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
break;

case 'chute': case 'chutar': case 'tapa': case 'soco': case 'socar': case 'beijo': case 'beijar': case 'beijob': case 'beijarb': case 'abraco': case 'abracar': case 'mata': case 'matar': case 'tapar': case 'goza': case 'gozar': case 'mamar': case 'mamada': case 'cafune': case 'morder': case 'mordida': case 'lamber': case 'lambida': case 'explodir': case 'sexo': try {
    const comandosImpróprios = ['sexo', 'surubao', 'goza', 'gozar', 'mamar', 'mamada', 'beijob', 'beijarb', 'tapar'];
    if (isModoLite && comandosImpróprios.includes(command)) return nazu.react('❌');
    
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if(!menc_os2) return reply('Marque um usuário.');
    let gamesData = fs.existsSync('./dados/src/funcs/json/games.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/games.json')) : { games2: {} };
    let GamezinData = fs.existsSync('./dados/src/funcs/json/markgame.json') ? JSON.parse(fs.readFileSync('./dados/src/funcs/json/markgame.json')) : { ranks: {} };
    let responseText = GamezinData[command].replaceAll('#nome#', `@${menc_os2.split('@')[0]}`) || `Voce acabou de dar um(a) ${command} no(a) @${menc_os2.split('@')[0]}`;
    let media = gamesData.games2[command];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [menc_os2] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [menc_os2], gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: [menc_os2] });
    };
} catch(e) {
console.error(e);
await reply("🐝 Oh não! Aconteceu um errinho inesperado aqui. Tente de novo daqui a pouquinho, por favor! 🥺");
};
   break;

  case 'afk':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      const reason = q.trim();
      groupData.afkUsers = groupData.afkUsers || {};
      groupData.afkUsers[sender] = {
        reason: reason || 'Não especificado',
        since: Date.now()
      };
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      let afkSetMessage = `😴 Você está AFK.`;
      if (reason) afkSetMessage += `
Motivo: ${reason}`;
      await reply(afkSetMessage);
  } catch (e) {
      console.error('Erro no comando afk:', e);
      await reply("Ocorreu um erro ao definir AFK 💔");
  }
  break;
  
  case 'voltei':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.afkUsers && groupData.afkUsers[sender]) {
        delete groupData.afkUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`👋 Bem-vindo(a) de volta! Seu status AFK foi removido.`);
    } else {
        await reply("Você não estava AFK.");
      }
  } catch (e) {
      console.error('Erro no comando voltei:', e);
      await reply("Ocorreu um erro ao remover AFK 💔");
  }
  break;
  
  case 'regras':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!groupData.rules || groupData.rules.length === 0) {
        return reply("📜 Nenhuma regra definida para este grupo ainda.");
      }
      let rulesMessage = `📜 *Regras do Grupo ${groupName}* 📜

`;
      groupData.rules.forEach((rule, index) => {
        rulesMessage += `${index + 1}. ${rule}
`;
      });
      await reply(rulesMessage);
  } catch (e) {
      console.error('Erro no comando regras:', e);
      await reply("Ocorreu um erro ao buscar as regras 💔");
  }
  break;

  case 'addregra':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem adicionar regras.");
      if (!q) return reply(`📝 Por favor, forneça o texto da regra. Ex: ${prefix}addregra Proibido spam.`);
      groupData.rules = groupData.rules || [];
      groupData.rules.push(q);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Regra adicionada com sucesso!
${groupData.rules.length}. ${q}`);
  } catch (e) {
      console.error('Erro no comando addregra:', e);
      await reply("Ocorreu um erro ao adicionar a regra 💔");
  }
  break;
  
  case 'delregra':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem remover regras.");
      if (!q || isNaN(parseInt(q))) return reply(`🔢 Por favor, forneça o número da regra a ser removida. Ex: ${prefix}delregra 3`);
      
      groupData.rules = groupData.rules || [];
      const ruleNumber = parseInt(q);
      if (ruleNumber < 1 || ruleNumber > groupData.rules.length) {
        return reply(`❌ Número de regra inválido. Use ${prefix}regras para ver a lista. Atualmente existem ${groupData.rules.length} regras.`);
      }
      const removedRule = groupData.rules.splice(ruleNumber - 1, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`🗑️ Regra "${removedRule}" removida com sucesso!`);
    } catch (e) {
      console.error('Erro no comando delregra:', e);
      await reply("Ocorreu um erro ao remover a regra 💔");
    }
    break;

  case 'addmod':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem adicionar moderadores.");
      if (!menc_os2) return reply(`Marque o usuário que deseja promover a moderador. Ex: ${prefix}addmod @usuario`);
      const modToAdd = menc_os2;
      if (groupData.moderators.includes(modToAdd)) {
        return reply(`@${modToAdd.split('@')[0]} já é um moderador.`, { mentions: [modToAdd] });
      }
      groupData.moderators.push(modToAdd);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ @${modToAdd.split('@')[0]} foi promovido a moderador do grupo!`, { mentions: [modToAdd] });
  } catch (e) {
      console.error('Erro no comando addmod:', e);
      await reply("Ocorreu um erro ao adicionar moderador 💔");
  }
break;

  case 'delmod':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem remover moderadores.");
      if (!menc_os2) return reply(`Marque o usuário que deseja remover de moderador. Ex: ${prefix}delmod @usuario`);
      const modToRemove = menc_os2;
      const modIndex = groupData.moderators.indexOf(modToRemove);
      if (modIndex === -1) {
        return reply(`@${modToRemove.split('@')[0]} não é um moderador.`, { mentions: [modToRemove] });
      }
      groupData.moderators.splice(modIndex, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ @${modToRemove.split('@')[0]} não é mais um moderador do grupo.`, { mentions: [modToRemove] });
  } catch (e) {
      console.error('Erro no comando delmod:', e);
      await reply("Ocorreu um erro ao remover moderador 💔");
  }
  break;

  case 'listmods': case 'modlist':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.moderators.length === 0) {
        return reply("🛡️ Não há moderadores definidos para este grupo.");
      }
      let modsMessage = `🛡️ *Moderadores do Grupo ${groupName}* 🛡️

`;
      const mentionedUsers = [];
      groupData.moderators.forEach((modJid) => {
        modsMessage += `➥ @${modJid.split('@')[0]}
`;
        mentionedUsers.push(modJid);
      });
      await reply(modsMessage, { mentions: mentionedUsers });
  } catch (e) {
      console.error('Erro no comando listmods:', e);
      await reply("Ocorreu um erro ao listar moderadores 💔");
  }
  break;

  case 'grantmodcmd': case 'addmodcmd':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
      if (!q) return reply(`Por favor, especifique o comando para permitir aos moderadores. Ex: ${prefix}grantmodcmd ban`);
      const cmdToAllow = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      if (groupData.allowedModCommands.includes(cmdToAllow)) {
        return reply(`Comando "${cmdToAllow}" já está permitido para moderadores.`);
      }
      groupData.allowedModCommands.push(cmdToAllow);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Moderadores agora podem usar o comando: ${prefix}${cmdToAllow}`);
  } catch (e) {
      console.error('Erro no comando grantmodcmd:', e);
      await reply("Ocorreu um erro ao permitir comando para moderadores 💔");
  }
  break;

  case 'revokemodcmd': case 'delmodcmd':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
      if (!q) return reply(`Por favor, especifique o comando para proibir aos moderadores. Ex: ${prefix}revokemodcmd ban`);
      const cmdToDeny = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      const cmdIndex = groupData.allowedModCommands.indexOf(cmdToDeny);
      if (cmdIndex === -1) {
        return reply(`Comando "${cmdToDeny}" não estava permitido para moderadores.`);
      }
      groupData.allowedModCommands.splice(cmdIndex, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Moderadores não podem mais usar o comando: ${prefix}${cmdToDeny}`);
  } catch (e) {
      console.error('Erro no comando revokemodcmd:', e);
      await reply("Ocorreu um erro ao proibir comando para moderadores 💔");
  }
  break;

  case 'listmodcmds':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.allowedModCommands.length === 0) {
        return reply("🔧 Nenhum comando específico permitido para moderadores neste grupo.");
      }
      let cmdsMessage = `🔧 *Comandos Permitidos para Moderadores em ${groupName}* 🔧\n\n`;
      groupData.allowedModCommands.forEach((cmd) => {
        cmdsMessage += `➥ ${prefix}${cmd}\n`;
      });
      await reply(cmdsMessage);
  } catch (e) {
      console.error('Erro no comando listmodcmds:', e);
      await reply("Ocorreu um erro ao listar comandos de moderadores 💔");
  }
  break;

  case 'clima':
    try {
      if (!q) return reply('Digite o nome da cidade para pesquisar o clima.');
      const geocodingResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
      if (!geocodingResponse.data.results || geocodingResponse.data.results.length === 0) {
        return reply(`Cidade "${q}" não encontrada.`);
      }
      const { latitude, longitude, name } = geocodingResponse.data.results[0];
      const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weathercode,temperature_2m,relativehumidity_2m,windspeed_10m,winddirection_10m`);
      const { temperature_2m: temperature, relativehumidity_2m: relativehumidity, windspeed_10m: windspeed, winddirection_10m: winddirection, weathercode } = weatherResponse.data.current;

      let weatherDescription;
      switch (weathercode) {
        case 0:
          weatherDescription = "Céu limpo";
          break;
        case 1:
          weatherDescription = "Predominantemente limpo";
          break;
        case 2:
          weatherDescription = "Parcialmente nublado";
          break;
        case 3:
          weatherDescription = "Nublado";
          break;
        case 45:
          weatherDescription = "Nevoeiro";
          break;
        case 48:
          weatherDescription = "Nevoeiro com geada";
          break;
        case 51:
          weatherDescription = "Chuvisco leve";
          break;
        case 53:
          weatherDescription = "Chuvisco moderado";
          break;
        case 55:
          weatherDescription = "Chuvisco intenso";
          break;
        case 56:
          weatherDescription = "Chuvisco leve com geada";
          break;
        case 57:
          weatherDescription = "Chuvisco intenso com geada";
          break;
        case 61:
          weatherDescription = "Chuva leve";
          break;
        case 63:
          weatherDescription = "Chuva moderada";
          break;
        case 65:
          weatherDescription = "Chuva intensa";
          break;
        case 66:
          weatherDescription = "Chuva leve com geada";
          break;
        case 67:
          weatherDescription = "Chuva intensa com geada";
          break;
        case 71:
          weatherDescription = "Neve leve";
          break;
        case 73:
          weatherDescription = "Neve moderada";
          break;
        case 75:
          weatherDescription = "Neve intensa";
          break;
        case 77:
          weatherDescription = "Grãos de neve";
          break;
        case 80:
          weatherDescription = "Pancadas de chuva leve";
          break;
        case 81:
          weatherDescription = "Pancadas de chuva moderada";
          break;
        case 82:
          weatherDescription = "Pancadas de chuva intensa";
          break;
        case 85:
          weatherDescription = "Pancadas de neve leve";
          break;
        case 86:
          weatherDescription = "Pancadas de neve intensa";
          break;
        case 95:
          weatherDescription = "Tempestade";
          break;
        case 96:
          weatherDescription = "Tempestade com granizo leve";
          break;
        case 99:
          weatherDescription = "Tempestade com granizo intenso";
          break;
        default:
          weatherDescription = "Condição desconhecida";
      }
      
      let weatherEmoji;
      switch (weathercode) {
        case 0:
          weatherEmoji = "☀️";
          break;
        case 1:
        case 2:
          weatherEmoji = "🌤️";
          break;
        case 3:
          weatherEmoji = "☁️";
          break;
        case 45:
        case 48:
          weatherEmoji = "🌫️";
          break;
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
          weatherEmoji = "🌧️";
          break;
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
          weatherEmoji = "🌧️";
          break;
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
          weatherEmoji = "❄️";
          break;
        case 80:
        case 81:
        case 82:
          weatherEmoji = "🌧️";
          break;
        case 95:
        case 96:
        case 99:
          weatherEmoji = "⛈️";
          break;
        default:
          weatherEmoji = "🌈";
      }

      let windDirectionEmoji;
      if (winddirection >= 337.5 || winddirection < 22.5) {
        windDirectionEmoji = "⬆️";
      } else if (winddirection >= 22.5 && winddirection < 67.5) {
        windDirectionEmoji = "↗️";
      } else if (winddirection >= 67.5 && winddirection < 112.5) {
        windDirectionEmoji = "➡️";
      } else if (winddirection >= 112.5 && winddirection < 157.5) {
        windDirectionEmoji = "↘️";
      } else if (winddirection >= 157.5 && winddirection < 202.5) {
        windDirectionEmoji = "⬇️";
      } else if (winddirection >= 202.5 && winddirection < 247.5) {
        windDirectionEmoji = "↙️";
      } else if (winddirection >= 247.5 && winddirection < 292.5) {
        windDirectionEmoji = "⬅️";
      } else {
        windDirectionEmoji = "↖️";
      }

      const weatherInfo = `🌦️ *Clima em ${name}*

🌡️ *Temperatura:* ${temperature}°C
💧 *Umidade:* ${relativehumidity}%
💨 *Vento:* ${windspeed} km/h ${windDirectionEmoji}
${weatherEmoji} *${weatherDescription}*`;
      await reply(weatherInfo);
    } catch (e) {
      console.error(e);
      await reply("Ocorreu um erro ao pesquisar o clima 💔");
    }
    break;

 default:
  if(isCmd) await reply(`🤖Desculpe, Comando inválido, use o ${prefixo}menu e Verifique novamente`)
 }; 
  } catch(error) {
    console.error('==== ERRO NO PROCESSAMENTO DA MENSAGEM ====');
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack trace:', error.stack);
    
    try {
      console.error('Tipo de mensagem:', type);
      console.error('Comando (se aplicável):', isCmd ? command : 'N/A');
      console.error('Grupo:', isGroup ? groupName : 'Mensagem privada');
      console.error('Remetente:', sender);
    } catch (logError) {
      console.error('Erro ao registrar informações adicionais:', logError);
    }
  };
};


function getDiskSpaceInfo() {
  try {
    const platform = os.platform();
    let totalBytes = 0;
    let freeBytes = 0;
    const defaultResult = { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };

    if (platform === 'win32') {
      try {
      const scriptPath = __dirname;
      const driveLetter = path.parse(scriptPath).root.charAt(0);
      const command = `fsutil volume diskfree ${driveLetter}:`;
      const output = execSync(command).toString();
      const lines = output.split('\n');
        
      const freeLine = lines.find(line => line.includes('Total # of free bytes'));
      const totalLine = lines.find(line => line.includes('Total # of bytes'));
        
      if (freeLine) freeBytes = parseFloat(freeLine.split(':')[1].trim().replace(/\./g, ''));
      if (totalLine) totalBytes = parseFloat(totalLine.split(':')[1].trim().replace(/\./g, ''));
      } catch (winError) {
        console.error("Erro ao obter espaço em disco no Windows:", winError);
        return defaultResult;
      }
    } else if (platform === 'linux' || platform === 'darwin') {
      try {
        const command = 'df -k .';
      const output = execSync(command).toString();
      const lines = output.split('\n');
        
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
          totalBytes = parseInt(parts[1]) * 1024;
          freeBytes = parseInt(parts[3]) * 1024;
        }
      } catch (unixError) {
        console.error("Erro ao obter espaço em disco no Linux/macOS:", unixError);
        return defaultResult;
      }
    } else {
      console.warn(`Plataforma ${platform} não suportada para informações de disco`);
      return defaultResult;
    };
    
    if (totalBytes > 0 && freeBytes >= 0) {
      const usedBytes = totalBytes - freeBytes;
      const totalGb = (totalBytes / 1024 / 1024 / 1024).toFixed(2);
      const freeGb = (freeBytes / 1024 / 1024 / 1024).toFixed(2);
      const usedGb = (usedBytes / 1024 / 1024 / 1024).toFixed(2);
      const percentUsed = ((usedBytes / totalBytes) * 100).toFixed(1) + '%';
      
      return { totalGb, freeGb, usedGb, percentUsed };
    } else {
      console.warn("Valores inválidos de espaço em disco:", { totalBytes, freeBytes });
      return defaultResult;
    }
    } catch (error) {
    console.error("Erro ao obter informações de disco:", error);
    return { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };
  };
};


cron.schedule('* * * * *', async () => {
  const DIR_PROGRAM = path.join('./dados/database/prog_actions.json');
  if (!fs.existsSync(DIR_PROGRAM)) {
    await fs.writeFileSync(DIR_PROGRAM, JSON.stringify([], null, 2));
  };
  const ACTIONS = JSON.parse(fs.readFileSync(DIR_PROGRAM, 'utf-8'));
  for (let i = ACTIONS.length - 1; i >= 0; i--) {
    const ACTION = ACTIONS[i];
    const Data = new Date(Date.now()).toLocaleString('pt-BR');
    if (Number(ACTION.data.ano) !== Number(Data.split('/').pop().split(',')[0])) continue;
    if (Number(ACTION.data.mes) !== Number(Data.split('/')[1])) continue;
    if (Number(ACTION.data.dia) !== Number(Data.split('/')[0])) continue;
    if (Number(ACTION.hora.hora) > Number(Data.split(' ').pop().split(':')[0])) continue;
    if (Number(ACTION.hora.minuto) > Number(Data.split(':')[1])) continue;
    if (ACTION.tipo && ACTION.tipo === "lembrete") {
      const destino = ACTION.destino === 'privado' ? ACTION.sender : ACTION.from;
      await SocketActions.sendMessage(destino, { text: `${ACTION.texto}\n\n@${ACTION.sender.split('@')[0]}`, mentions: [ACTION.sender] });
    } else if (ACTION.tipo && ACTION.tipo === "grupo") {
      await SocketActions.groupSettingUpdate(ACTION.from, ACTION.acao === 'abrir' ? 'not_announcement' : 'announcement');
    };
    ACTIONS.splice(i, 1);
  }
  fs.writeFileSync(DIR_PROGRAM, JSON.stringify(ACTIONS, null, 2));
});


module.exports = NazuninhaBotExec;