const menu = (prefix, botName = "MeuBot", userName = "Usuário", botVersion) => {
  
 return `
╭═══════════════════ ⪨
│ - Bem-vindo(a) ${userName}!
│ - 🤖Bot name: ${botName}
│ - Version: ${botVersion}
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - MENU PRINCIPAL 🎛️
│✾ ${prefix}menuadm
│✾ ${prefix}brincadeiras
│✾ ${prefix}menudono
│✾ ${prefix}alterador
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - MEMBROS 👤
│✾ ${prefix}perfil 
│✾ ${prefix}afk "mensagem"
│✾ ${prefix}meustatus
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - DOWNLOADS/PESQUISAS 📀
│✾ ${prefix}play (Nome)
│✾ ${prefix}playdoc (Nome)
│✾ ${prefix}instagram (Link)
│✾ ${prefix}facebook (Link)
│✾ ${prefix}twitter (Link)
│✾ ${prefix}Tiktok (Link)
│✾ ${prefix}Aptoide (link)
│✾ ${prefix}Aptoide_pesquisa (Nome)
│✾ ${prefix}spotify (link)
│✾ ${prefix}Letra (nome-msc)
│✾ ${prefix}Kwai (Link)
│✾ ${prefix}soundcloud (link)
│✾ ${prefix}Ifunny (Link)
│✾ ${prefix}threads (Link)
│✾ ${prefix}upload (foto/video)
│✾ ${prefix}encurtalink
│✾ ${prefix}moeda (Tipo)
│✾ ${prefix}gpt (PERGUNTA)
│✾ ${prefix}resumir (texto)
│✾ ${prefix}tabelacamp (brasileirao)
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - INFORMAÇÃO 📝
│✾ ${prefix}ping 
│✾ ${prefix}rankativo 
│✾ ${prefix}rankativog
│✾ ${prefix}rankinativo 
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - MENU FIGURINHAS 💈
│✾ ${prefix}emojimix
│✾ ${prefix}ttp
│✾ ${prefix}sticker
│✾ ${prefix}sticker2
│✾ ${prefix}qc
│✾ ${prefix}brat
│✾ ${prefix}figualetoria
│✾ ${prefix}rename
│✾ ${prefix}rgtake
│✾ ${prefix}take
│✾ ${prefix}toimg
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - INTERATIVOS 🪀
│✾ ${prefix}gerarnick
│✾ ${prefix}dono
│✾ ${prefix}ping
│✾ ${prefix}rvisu
│✾ ${prefix}totalcmd
│✾ ${prefix}topcmd
│✾ ${prefix}cmdinfo
│✾ ${prefix}statusgp
│✾ ${prefix}statusbot
│✾ ${prefix}regras
│✾ ${prefix}mention
╰═══════════════════ ⪨
`;
}

module.exports = menu;
