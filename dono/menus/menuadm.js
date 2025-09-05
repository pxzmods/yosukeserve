async function menuadm(prefix, botName = "MeuBot", userName = "Usuário", isLiteMode = false) {
  return `
╭═══════════════════ ⪨
│ - ADMINISTRAÇÃO 🎛️
│✾ ${prefix}ban
│✾ ${prefix}promover
│✾ ${prefix}rebaixar
│✾ ${prefix}mute
│✾ ${prefix}desmute
│✾ ${prefix}adv
│✾ ${prefix}rmadv
│✾ ${prefix}listadv
│✾ ${prefix}blockuser
│✾ ${prefix}unblockuser
│✾ ${prefix}listblocksgp
│✾ ${prefix}addblacklist
│✾ ${prefix}delblacklist
│✾ ${prefix}listblacklist
│✾ ${prefix}del
│✾ ${prefix}limpar
│✾ ${prefix}hidetag
│✾ ${prefix}marcar
│✾ ${prefix}linkgp
│✾ ${prefix}grupo A/F
│✾ ${prefix}setname
│✾ ${prefix}setdesc
│✾ ${prefix}addregra
│✾ ${prefix}delregra
│✾ ${prefix}blockcmd
│✾ ${prefix}unblockcmd
│✾ ${prefix}addmod
│✾ ${prefix}delmod
│✾ ${prefix}listmods
│✾ ${prefix}grantmodcmd
│✾ ${prefix}revokemodcmd
│✾ ${prefix}listmodcmds
│✾ ${prefix}autodl
│✾ ${prefix}modobn
│✾ ${prefix}modonsfw
│✾ ${prefix}bemvindo
│✾ ${prefix}saida
│✾ ${prefix}autosticker
│✾ ${prefix}soadm
│✾ ${prefix}x9
│✾ ${prefix}modolite
│✾ ${prefix}cmdlimit
│✾ ${prefix}antilinkgp
│✾ ${prefix}antilinkhard
│✾ ${prefix}antiporn
│✾ ${prefix}antiflood
│✾ ${prefix}antifake
│✾ ${prefix}antipt
│✾ ${prefix}antidoc
│✾ ${prefix}antiloc
│✾ ${prefix}legendasaiu
│✾ ${prefix}legendabv
│✾ ${prefix}fotobv
│✾ ${prefix}rmfotobv
│✾ ${prefix}fotosaiu
│✾ ${prefix}rmfotosaiu
╰═══════════════════ ⪨
`;
}

module.exports = menuadm;

