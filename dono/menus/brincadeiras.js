async function menubn(prefix, botName = "MeuBot", userName = "Usuário", isLiteMode = false) {
  let menuContent = `
╭═══════════════════ ⪨
│ - JOGOS  🎊
│✾ ${prefix}jogodavelha
│✾ ${prefix}eununca
│✾ ${prefix}vab
│✾ ${prefix}chance
│✾ ${prefix}quando
│✾ ${prefix}casal
│✾ ${prefix}shipo
│✾ ${prefix}sn
│✾ ${prefix}ppt
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - BRINCADEIRAS  🎊
${!isLiteMode ? `
│✾ ${prefix}suicidio` : ''}
│✾ ${prefix}chute
│✾ ${prefix}chutar
│✾ ${prefix}tapa
│✾ ${prefix}soco
│✾ ${prefix}socar
│✾ ${prefix}explodir
│✾ ${prefix}abraco
│✾ ${prefix}abracar
│✾ ${prefix}morder
│✾ ${prefix}mordida
│✾ ${prefix}lamber
│✾ ${prefix}lambida
│✾ ${prefix}beijo
│✾ ${prefix}beijar
│✾ ${prefix}mata
│✾ ${prefix}matar
│✾ ${prefix}cafune
│✾ ${prefix}surubao
│✾ ${prefix}sexo
│✾ ${prefix}beijob
│✾ ${prefix}beijarb
│✾ ${prefix}tapar
│✾ ${prefix}goza
│✾ ${prefix}gozar
│✾ ${prefix}mamar
│✾ ${prefix}mamada
┊${!isLiteMode ? `\n│✾ ${prefix}gay` : ''}
│✾ ${prefix}burro
│✾ ${prefix}inteligente
│✾ ${prefix}otaku
│✾ ${prefix}fiel
│✾ ${prefix}infiel${!isLiteMode ? `\n│✾ ${prefix}corno` : ''}
│✾ ${prefix}gado
│✾ ${prefix}gostoso
│✾ ${prefix}feio
│✾ ${prefix}rico
│✾ ${prefix}pobre${!isLiteMode ? `\n│✾ ${prefix}pirocudo` : ''}${!isLiteMode ? `\n│✾ ${prefix}nazista` : ''}${!isLiteMode ? `\n│✾ ${prefix}ladrao` : ''}
│✾ ${prefix}safado
│✾ ${prefix}vesgo
│✾ ${prefix}bebado${!isLiteMode ? `\n│✾ ${prefix}machista` : ''}${!isLiteMode ? `\n│✾ ${prefix}homofobico` : ''}${!isLiteMode ? `\n│✾ ${prefix}racista` : ''}
│✾ ${prefix}chato
│✾ ${prefix}sortudo
│✾ ${prefix}azarado
│✾ ${prefix}forte
│✾ ${prefix}fraco
│✾ ${prefix}pegador
│✾ ${prefix}otario
│✾ ${prefix}macho
│✾ ${prefix}bobo
│✾ ${prefix}nerd
│✾ ${prefix}preguicoso
│✾ ${prefix}trabalhador
│✾ ${prefix}brabo
│✾ ${prefix}lindo
│✾ ${prefix}malandro
│✾ ${prefix}simpatico
│✾ ${prefix}engracado
│✾ ${prefix}charmoso
│✾ ${prefix}misterioso
│✾ ${prefix}carinhoso
│✾ ${prefix}desumilde
│✾ ${prefix}humilde
│✾ ${prefix}ciumento
│✾ ${prefix}corajoso
│✾ ${prefix}covarde
│✾ ${prefix}esperto${!isLiteMode ? `\n│✾ ${prefix}talarico` : ''}
│✾ ${prefix}chorao
│✾ ${prefix}brincalhao${!isLiteMode ? `\n│✾ ${prefix}bolsonarista` : ''}${!isLiteMode ? `\n│✾ ${prefix}petista` : ''}${!isLiteMode ? `\n│✾ ${prefix}comunista` : ''}${!isLiteMode ? `\n│✾ ${prefix}lulista` : ''}${!isLiteMode ? `\n│✾ ${prefix}traidor` : ''}${!isLiteMode ? `\n│✾ ${prefix}bandido` : ''}${!isLiteMode ? `\n│✾ ${prefix}cachorro` : ''}${!isLiteMode ? `\n│✾ ${prefix}vagabundo` : ''}${!isLiteMode ? `\n│✾ ${prefix}pilantra` : ''}
│✾ ${prefix}mito
│✾ ${prefix}padrao
│✾ ${prefix}comedia${!isLiteMode ? `
│✾ ${prefix}psicopata` : ''}
│✾ ${prefix}fortao
│✾ ${prefix}magrelo
│✾ ${prefix}bombado
│✾ ${prefix}chefe
│✾ ${prefix}presidente
│✾ ${prefix}rei
│✾ ${prefix}patrao
│✾ ${prefix}playboy
│✾ ${prefix}zueiro
│✾ ${prefix}gamer
│✾ ${prefix}programador
│✾ ${prefix}visionario
│✾ ${prefix}billionario
│✾ ${prefix}poderoso
│✾ ${prefix}vencedor
│✾ ${prefix}senhor
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - BRINCADEIRAS FEMININO 🎊
┊${!isLiteMode ? `\n│✾ ${prefix}lésbica` : ''}
│✾ ${prefix}burra
│✾ ${prefix}inteligente
│✾ ${prefix}otaku
│✾ ${prefix}fiel
│✾ ${prefix}infiel${!isLiteMode ? `\n│✾ ${prefix}corna` : ''}
│✾ ${prefix}gada
│✾ ${prefix}gostosa
│✾ ${prefix}feia
│✾ ${prefix}rica
│✾ ${prefix}pobre${!isLiteMode ? `\n│✾ ${prefix}bucetuda` : ''}${!isLiteMode ? `\n│✾ ${prefix}nazista` : ''}${!isLiteMode ? `\n│✾ ${prefix}ladra` : ''}
│✾ ${prefix}safada
│✾ ${prefix}vesga
│✾ ${prefix}bêbada${!isLiteMode ? `\n│✾ ${prefix}machista` : ''}${!isLiteMode ? `\n│✾ ${prefix}homofóbica` : ''}${!isLiteMode ? `\n│✾ ${prefix}racista` : ''}
│✾ ${prefix}chata
│✾ ${prefix}sortuda
│✾ ${prefix}azarada
│✾ ${prefix}forte
│✾ ${prefix}fraca
│✾ ${prefix}pegadora
│✾ ${prefix}otária
│✾ ${prefix}boba
│✾ ${prefix}nerd
│✾ ${prefix}preguiçosa
│✾ ${prefix}trabalhadora
│✾ ${prefix}braba
│✾ ${prefix}linda
│✾ ${prefix}malandra
│✾ ${prefix}simpática
│✾ ${prefix}engraçada
│✾ ${prefix}charmosa
│✾ ${prefix}misteriosa
│✾ ${prefix}carinhosa
│✾ ${prefix}desumilde
│✾ ${prefix}humilde
│✾ ${prefix}ciumenta
│✾ ${prefix}corajosa
│✾ ${prefix}covarde
│✾ ${prefix}esperta${!isLiteMode ? `\n│✾ ${prefix}talarica` : ''}
│✾ ${prefix}chorona
│✾ ${prefix}brincalhona${!isLiteMode ? `\n│✾ ${prefix}bolsonarista` : ''}${!isLiteMode ? `\n│✾ ${prefix}petista` : ''}${!isLiteMode ? `\n│✾ ${prefix}comunista` : ''}${!isLiteMode ? `\n│✾ ${prefix}lulista` : ''}${!isLiteMode ? `\n│✾ ${prefix}traidora` : ''}${!isLiteMode ? `\n│✾ ${prefix}bandida` : ''}${!isLiteMode ? `\n│✾ ${prefix}cachorra` : ''}${!isLiteMode ? `\n│✾ ${prefix}vagabunda` : ''}${!isLiteMode ? `\n│✾ ${prefix}pilantra` : ''}
│✾ ${prefix}mito
│✾ ${prefix}padrão
│✾ ${prefix}comédia${!isLiteMode ? `\n│✾ ${prefix}psicopata` : ''}
│✾ ${prefix}fortona
│✾ ${prefix}magrela
│✾ ${prefix}bombada
│✾ ${prefix}chefe
│✾ ${prefix}presidenta
│✾ ${prefix}rainha
│✾ ${prefix}patroa
│✾ ${prefix}playgirl
│✾ ${prefix}zueira
│✾ ${prefix}gamer
│✾ ${prefix}programadora
│✾ ${prefix}visionária
│✾ ${prefix}bilionária
│✾ ${prefix}poderosa
│✾ ${prefix}vencedora
│✾ ${prefix}senhora
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - BRINCADEIRAS RANKS 🎊
│✾ ${prefix}rankgay
│✾ ${prefix}rankburro
│✾ ${prefix}rankinteligente
│✾ ${prefix}rankotaku
│✾ ${prefix}rankfiel
│✾ ${prefix}rankinfiel
│✾ ${prefix}rankcorno
│✾ ${prefix}rankgado
│✾ ${prefix}rankgostoso
│✾ ${prefix}rankrico
│✾ ${prefix}rankpobre
│✾ ${prefix}rankforte
│✾ ${prefix}rankpegador
│✾ ${prefix}rankmacho
│✾ ${prefix}ranknerd
│✾ ${prefix}ranktrabalhador
│✾ ${prefix}rankbrabo
│✾ ${prefix}ranklindo
│✾ ${prefix}rankmalandro
│✾ ${prefix}rankengracado
│✾ ${prefix}rankcharmoso
│✾ ${prefix}rankvisionario
│✾ ${prefix}rankpoderoso
│✾ ${prefix}rankvencedor
╰═══════════════════ ⪨

╭═══════════════════ ⪨
│ - RANKS FEMININO 🎊
│✾ ${prefix}ranklesbica
│✾ ${prefix}rankburra
│✾ ${prefix}rankinteligente
│✾ ${prefix}rankotaku
│✾ ${prefix}rankfiel
│✾ ${prefix}rankinfiel
│✾ ${prefix}rankcorna
│✾ ${prefix}rankgada
│✾ ${prefix}rankgostosa
│✾ ${prefix}rankrica
│✾ ${prefix}rankpobre
│✾ ${prefix}rankforte
│✾ ${prefix}rankpegadora
│✾ ${prefix}ranknerd
│✾ ${prefix}ranktrabalhadora
│✾ ${prefix}rankbraba
│✾ ${prefix}ranklinda
│✾ ${prefix}rankmalandra
│✾ ${prefix}rankengracada
│✾ ${prefix}rankcharmosa
│✾ ${prefix}rankvisionaria
│✾ ${prefix}rankpoderosa
│✾ ${prefix}rankvencedora
╰═══════════════════ ⪨
`;

  return menuContent;
}

module.exports = menubn;

