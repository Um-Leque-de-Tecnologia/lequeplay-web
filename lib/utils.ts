/**
 * Quantos caracteres da sinopse cabem no resumo antes do "ver mais".
 *
 * É corte de **apresentação**, não de dado: o pedaço que sobra continua no
 * HTML, só que escondido. Cortar no servidor — mandar para o navegador só os
 * primeiros caracteres — economizaria uns bytes e custaria caro: quem indexa
 * a página passaria a ver meia sinopse, e abrir o "ver mais" viraria uma nova
 * ida ao servidor. O texto inteiro sai do servidor sempre; o que muda é o que
 * está visível.
 *
 * O custo aceito: `hidden` tira o trecho da busca do navegador e da árvore de
 * acessibilidade. Leitor de tela chega nele pelo botão; o Ctrl+F só acha o que
 * está aberto. `hidden="until-found"` resolveria o Ctrl+F — fica como próximo
 * passo.
 */

export const CARACTERES_NO_RESUMO = 180;

/**
 * Onde cortar sem partir palavra: o último espaço até o limite. Se não
 * houver espaço nenhum (palavra gigante, improvável numa sinopse), cai no
 * limite cru — melhor cortar do que não cortar.
 *
 * Pontuação colada no fim do resumo passa para o lado do resto: fechada, a
 * sinopse não termina em `superação,…`; aberta, a vírgula volta ao lugar.
 */

export function corte(sinopse: string, ): number {
  if (sinopse.length <= CARACTERES_NO_RESUMO) return sinopse.length;

  const ultimoEspaco = sinopse.lastIndexOf(" ", CARACTERES_NO_RESUMO);
  if (ultimoEspaco === -1) return CARACTERES_NO_RESUMO;

  const antes = sinopse.charAt(ultimoEspaco - 1);
  return /[,;:]/.test(antes) ? ultimoEspaco - 1 : ultimoEspaco;
}