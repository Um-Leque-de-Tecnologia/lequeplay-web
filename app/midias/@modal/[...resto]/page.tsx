/**
 * Fecha a moldura quando a navegação sai da ficha sem passar pelo voltar: o
 * link de uma temporada, ou qualquer outro endereço abaixo de `/midias`.
 *
 * Na navegação suave, o slot que não casa com a URL nova continua mostrando o
 * que mostrava — é por isso que a moldura ficava presa. Casar com uma página
 * que devolve `null` é o que tira a moldura da tela (LP-509).
 *
 * O `default.tsx` não resolve este caso: ele só entra quando o Next monta a
 * árvore do zero (F5, link colado) e não sabe o que o slot mostrava.
 */
export default function SemModalAbaixoDeMidias() {
  return null;
}
