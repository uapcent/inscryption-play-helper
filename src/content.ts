/**
 * The words of the helper, each as [English, Spanish]. The rules are a modified version of
 * CrypticCrafter's, with the Kaycee's Mod expansion as house rules: when they change after
 * playtesting, change them here too.
 */
import type { Token } from './game';

export type T = readonly [string, string];

export const RULES_DATE = '2026-10-30';

export const EVENTS: Record<Token, { icon: string; name: T; text: T }> = {
  graft: {
    icon: 'cardmergenode', name: ['Sigil graft', 'Injerto de sello'],
    text: ['Choose two cards of your deck: the first leaves the game, and the second gains one of its sigils. Slip that sigil’s patch into its sleeve.', 'Elige dos cartas de tu mazo: la primera sale de la partida y la segunda gana uno de sus sellos. Mete el parche de ese sello en su funda.'],
  },
  campfire: {
    icon: 'campfire', name: ['Campfire', 'Hoguera'],
    text: ['One card of your deck gains +1 power or +2 health: slip a number patch into its sleeve. You may push your luck for a second boost on the same card: roll the d20 first; on a 1 to 5 the survivors eat the card, and it leaves the game.', 'Una carta de tu mazo gana +1 de poder o +2 de vida: mete un parche de número en su funda. Puedes tentar a la suerte con una segunda mejora en la misma carta: antes tira el d20; con un 1 a 5 los supervivientes se comen la carta, y sale de la partida.'],
  },
  mycologists: {
    icon: 'mushrooms', name: ['The Mycologists', 'Los Micólogos'],
    text: ['Choose two cards of your deck with the same name (not Squirrels, swap cards or pelts). The first leaves the game; the second’s power and health each gain as much as they have, up to 2 (a 0 stays 0, a 1 gains +1, a 2 or more gains +2). Slip in a number patch for each. Patches of the card that leaves move to the one that stays; sigils it already has don’t stack.', 'Elige dos cartas de tu mazo con el mismo nombre (no Ardillas, cartas de intercambio ni pieles). La primera sale de la partida; el poder y la vida de la segunda ganan cada uno lo que tienen, hasta 2 (un 0 se queda en 0, un 1 gana +1, un 2 o más gana +2). Mete un parche de número por cada uno. Los parches de la carta que sale pasan a la que se queda; los sellos que ya tiene no se acumulan.'],
  },
  caravan: {
    icon: 'boulderchoice', name: ['The Caravan', 'La Caravana'],
    text: ['Reveal 3 items from the item pile and take one for free (you can hold up to 3). The other two go back to the bottom of the pile.', 'Destapa 3 objetos del montón de objetos y coge uno gratis (puedes tener hasta 3). Los otros dos vuelven al fondo del montón.'],
  },
  totem: {
    icon: 'buildtotemnode', name: ['Build a totem', 'Construir un tótem'],
    text: ['Choose one tribe head and one sigil stone. For the next round, every card of that tribe on your side gains that sigil. Then it’s taken apart.', 'Elige una cabeza de tribu y una piedra de sello. Durante la siguiente ronda, todas las cartas de esa tribu de tu lado ganan ese sello. Después se desmonta.'],
  },
  trading: {
    icon: 'tradepelts', name: ['The Trading Post', 'La Casa de comercio'],
    text: ['First buy pelts with the bones of your bank (Rabbit 2, Wolf 4, Golden 7), then trade any pelts of your deck for cards: a Rabbit Pelt for 2 of 6 common cards, a Wolf Pelt for 2 of 6 common cards with a sigil, a Golden Pelt for 1 of 3 rare cards. Traded pelts go back to the pelt pile; the ones you keep go into your deck.', 'Primero compra pieles con los huesos de tu banco (conejo 2, lobo 4, dorada 7) y después cambia pieles de tu mazo por cartas: una Piel de conejo por 2 de 6 cartas comunes, una Piel de lobo por 2 de 6 cartas comunes con sello, una Piel dorada por 1 de 3 cartas raras. Las pieles cambiadas vuelven al montón de pieles; las que te quedas van a tu mazo.'],
  },
  leshy: {
    icon: 'bossnode_leshy', name: ['Leshy’s trial', 'Prueba de Leshy'],
    text: ['Choose a trial. Shuffle your deck and draw 3 random cards: you pass if one of them meets it. Then shuffle them back.', 'Elige una prueba. Baraja tu mazo y roba 3 cartas al azar: la superas si una de ellas la cumple. Después devuélvelas al mazo.'],
  },
  deck: {
    icon: 'decktrialnode', name: ['Deck trial', 'Prueba de mazo'],
    text: ['Choose a trial. Shuffle your deck and draw 3 random cards: together they must reach the trial’s number. Then shuffle them back.', 'Elige una prueba. Baraja tu mazo y roba 3 cartas al azar: juntas deben llegar al número de la prueba. Después devuélvelas al mazo.'],
  },
  altar: {
    icon: 'removecardnode', name: ['The Bone Lord’s altar', 'El altar del Señor de los huesos'],
    text: ['Sacrifice one card of your deck to the Bone Lord: it leaves the game for good. Win or lose, your deck is one card thinner.', 'Sacrifica una carta de tu mazo al Señor de los huesos: sale de la partida para siempre. Ganes o pierdas, tu mazo tiene una carta menos.'],
  },
};

export const TRIALS: Record<string, { icon: string; name: T; text: T }> = {
  ring: { icon: 'trial_ring', name: ['Ring', 'Anillo'], text: ['Ringworm or Ouroboros among the 3 cards, or a card with a 0 or an 8 in its power or health.', 'Gusanillo u Ouroboros entre las 3 cartas, o una carta con un 0 o un 8 en su poder o su vida.'] },
  rarity: { icon: 'trial_rare', name: ['Rarity', 'Rareza'], text: ['A rare card among the 3.', 'Una carta rara entre las 3.'] },
  skins: { icon: 'trial_pelts', name: ['Skins', 'Pieles'], text: ['A pelt among the 3.', 'Una piel entre las 3.'] },
  winged: { icon: 'trial_flying', name: ['the Winged', 'los Alados'], text: ['A card with Airborne among the 3.', 'Una carta con Aéreo entre las 3.'] },
  finned: { icon: 'trial_submerge', name: ['the Finned', 'las Aletas'], text: ['A card with Waterborne among the 3.', 'Una carta con Acuático entre las 3.'] },
  young: { icon: 'trial_young', name: ['the Young', 'los Polluelos'], text: ['A card with Fledgling among the 3.', 'Una carta con Polluelo entre las 3.'] },
  blood: { icon: 'trial_blood', name: ['Blood', 'Sangre'], text: ['The 3 cost at least 4 blood together.', 'Las 3 cuestan al menos 4 de sangre entre todas.'] },
  bones: { icon: 'trial_bones', name: ['Bones', 'Huesos'], text: ['The 3 cost at least 4 bones together.', 'Las 3 cuestan al menos 4 huesos entre todas.'] },
  strength: { icon: 'trial_power', name: ['Strength', 'Fuerza'], text: ['At least 4 power together (pelts and tentacles count 0; Ant Damage counts the ants).', 'Al menos 4 de poder entre todas (las pieles y los tentáculos cuentan 0; Daño de hormigas cuenta las hormigas).'] },
  life: { icon: 'trial_toughness', name: ['Life', 'Vida'], text: ['At least 6 health together.', 'Al menos 6 de vida entre todas.'] },
  sigils: { icon: 'trial_abilities', name: ['Sigils', 'Sellos'], text: ['At least 3 sigils together (totem sigils don’t count).', 'Al menos 3 sellos entre todas (los sellos de tótem no cuentan).'] },
  kin: { icon: 'trial_tribes', name: ['Kin', 'Parentesco'], text: ['2 of the 3 share a tribe, or are the same card.', '2 de las 3 son de la misma tribu, o son la misma carta.'] },
};

export const BOON_TEXT: Record<string, { icon: string; name: T; text: T }> = {
  ambidextrous: { icon: 'boonicon_doubledraw', name: ['Ambidextrous', 'Ambidiestro'], text: ['You may draw twice at the start of each of your turns, for the whole round.', 'Puedes robar dos veces al principio de cada uno de tus turnos, durante toda la ronda.'] },
  goat: { icon: 'boonicon_startinggoat', name: ['Goat’s Blood', 'Sangre de cabra'], text: ['Start the round with the Sexy Black Goat on the board.', 'Empiezas la ronda con la Cabra negra sexy en el tablero.'] },
  forest: { icon: 'boonicon_startingtrees', name: ['Forest', 'Bosque'], text: ['Start the round with a fir on each of your spaces (Grand or Snowy Fir, from the swaps pile).', 'Empiezas la ronda con un abeto en cada uno de tus espacios (Abeto gigante o Abeto nevado, del montón de intercambios).'] },
  magpie: { icon: 'boonicon_tutordraw', name: ['Magpie’s Eye', 'Ojo de urraca'], text: ['Choose the 3 cards you draw at the start of the round from your deck, instead of drawing them at random.', 'Elige de tu mazo las 3 cartas que robas al empezar la ronda, en vez de robarlas al azar.'] },
  bone_lord: { icon: 'boonicon_startingbones', name: ['Bone Lord', 'Señor de los huesos'], text: ['Start the round with 8 bones.', 'Empiezas la ronda con 8 huesos.'] },
  lesser_bone_lord: { icon: 'boonicon_singlestartingbone', name: ['Lesser Bone Lord', 'Señor de los huesos menor'], text: ['Start the round with 4 bones.', 'Empiezas la ronda con 4 huesos.'] },
};

export const HEAD_NAMES: Record<string, T> = {
  birds: ['Birds', 'Pájaros'],
  bugs: ['Insects', 'Insectos'],
  deer: ['Hooved', 'Ungulados'],
  reptiles: ['Reptiles', 'Reptiles'],
  squirrels: ['Squirrels', 'Ardillas'],
  wolves: ['Canines', 'Cánidos'],
};

export const HEAD_ICONS: Record<string, string> = {
  birds: 'tribes/tribeicon_bird',
  bugs: 'tribes/tribeicon_insect',
  deer: 'tribes/tribeicon_hooved',
  reptiles: 'tribes/tribeicon_reptile',
  squirrels: 'portraits/portrait_squirrel',
  wolves: 'tribes/tribeicon_canine',
};

export const TURN_STEPS: { title: T; text: T }[] = [
  { title: ['Draw', 'Roba'], text: ['A creature card from your deck, or a Squirrel.', 'Una carta de criatura de tu mazo, o una Ardilla.'] },
  { title: ['Play cards', 'Juega cartas'], text: ['As many as you can pay for, one per space. Collect your bones.', 'Tantas como puedas pagar, una por espacio. Recoge tus huesos.'] },
  { title: ['Ring the bell', 'Toca la campana'], text: ['Your turn is over.', 'Tu turno ha terminado.'] },
  { title: ['Attack', 'Ataca'], text: ['Your cards strike one by one, following the arrow on the board. An empty space opposite means damage on the scale.', 'Tus cartas golpean una a una, siguiendo la flecha del tablero. Sin carta enfrente, el daño va a la balanza.'] },
  { title: ['Check the scale', 'Mira la balanza'], text: ['On 4 against a player: they draw an item. On 5: they lose a life.', 'En 4 en contra de un jugador: roba un objeto. En 5: pierde una vida.'] },
];

export const ALWAYS: T[] = [
  ['In every round, each player’s first turn counts at most 3 damage on the scale.', 'En cada ronda, el primer turno de cada jugador cuenta como mucho 3 de daño en la balanza.'],
  ['Blood is spent at once on a single card. Every card you sacrifice must already be on the board.', 'La sangre se gasta de una vez en una sola carta. Todo lo que sacrifiques tiene que estar ya en el tablero.'],
  ['Swap cards always go back to the swaps pile when they leave the board.', 'Las cartas de intercambio siempre vuelven a su montón cuando salen del tablero.'],
];

export const ALWAYS_BASE: T[] = [
  ['Each player can hold 1 item at a time. Used items go to the bottom of the pile.', 'Cada jugador puede tener 1 objeto a la vez. Los objetos usados van al fondo del montón.'],
];

export const ALWAYS_KAYCEE: T[] = [
  ['Each player can hold up to 3 items. Used items go to the bottom of the pile.', 'Cada jugador puede tener hasta 3 objetos. Los objetos usados van al fondo del montón.'],
  ['10 Squirrels per player per round. Out of Squirrels, out of luck. Squirrels from a bottle, the Squirrel Ball or the Pack Mule don’t count.', '10 Ardillas por jugador y ronda. Sin Ardillas, mala suerte. Las de la botella, la Bola de ardillas o la Mula de carga no cuentan.'],
  ['Cat and Child 13: roll the d20 after each sacrifice (Cat: a 7 makes it the Undead Cat; Child 13: a 13 makes it the Hungry Child).', 'Gato y Niña 13: tira el d20 tras cada sacrificio (Gato: con un 7 es el Gato no muerto; Niña 13: con un 13 es la Niña hambrienta).'],
];

/** The groups of the Cards list, in order. `sharedBack`: its back doesn't tell it apart from cards of another set. */
export const CARD_GROUPS: { id: string; title: T; where: T; sharedBack?: boolean }[] = [
  { id: 'base:squirrels', title: ['Squirrels', 'Ardillas'], where: ['10 for each player; the rest stay spare.', '10 para cada jugador; el resto queda de reserva.'] },
  { id: 'base:creatures', title: ['Creatures and rares', 'Criaturas y raras'], where: ['Shuffled into the draw pile.', 'Barajadas en el mazo de robo.'] },
  { id: 'base:items', title: ['Items', 'Objetos'], where: ['The item pile.', 'El montón de objetos.'] },
  { id: 'base:upgrades', title: ['Upgrades', 'Mejoras'], where: ['Keep the whole pile, whatever you play with.', 'Deja el montón entero, juguéis con lo que juguéis.'] },
  { id: 'base:swaps', title: ['Swap cards', 'Cartas de intercambio'], where: ['Keep the whole pile, whatever you play with.', 'Deja el montón entero, juguéis con lo que juguéis.'] },
  { id: 'base:smoke', title: ['Greater Smoke', 'Humo superior'], where: ['The Smoke pile.', 'El montón de Humo.'] },
  { id: 'base:death', title: ['Death cards', 'Cartas de muerte'], where: ['Add two or so to the draw pile; keep the blank ones apart.', 'Añade unas dos al mazo de robo; guarda aparte las que están en blanco.'] },
  { id: 'base:special', title: ['Leshy and the Undead Cat', 'Leshy y el Gato no muerto'], where: ['Near the board, out of the draw pile.', 'Cerca del tablero, fuera del mazo de robo.'] },
  { id: 'kaycee:creatures', title: ['Kaycee’s creatures', 'Criaturas de Kaycee'], where: ['Shuffled into the draw pile.', 'Barajadas en el mazo de robo.'] },
  { id: 'kaycee:items', title: ['Kaycee’s items', 'Objetos de Kaycee'], where: ['Same back as the items: in the item pile.', 'Mismo dorso que los objetos: en el montón de objetos.'], sharedBack: true },
  { id: 'kaycee:smoke', title: ['Smoke', 'Humo'], where: ['Same back as the Greater Smoke: in the Smoke pile.', 'Mismo dorso que el Humo superior: en el montón de Humo.'], sharedBack: true },
  { id: 'kaycee:aquasquirrels', title: ['Aquasquirrels', 'Acuardillas'], where: ['Near the board, for a failed Leshy’s trial.', 'Cerca del tablero, por si se falla una prueba de Leshy.'] },
  { id: 'kaycee:special', title: ['Sexy Black Goat and Hungry Child', 'Cabra negra sexy y Niña hambrienta'], where: ['Same back as the creatures: near the board, out of the draw pile.', 'Mismo dorso que las criaturas: cerca del tablero, fuera del mazo de robo.'], sharedBack: true },
  { id: 'kaycee:heads', title: ['Tribe heads', 'Cabezas de tribu'], where: ['Near the board, for Build a totem.', 'Cerca del tablero, para Construir un tótem.'] },
  { id: 'kaycee:stones', title: ['Sigil stones', 'Piedras de sello'], where: ['Near the board, for Build a totem.', 'Cerca del tablero, para Construir un tótem.'] },
  { id: 'kaycee:trials', title: ['Trials', 'Pruebas'], where: ['Near the board, split into Leshy’s and Deck trials.', 'Cerca del tablero, separadas en pruebas de Leshy y de mazo.'] },
  { id: 'kaycee:boons', title: ['Boons', 'Bendiciones'], where: ['Same back as the trials: keep them in their own stack.', 'Mismo dorso que las pruebas: en su propio montón.'] },
  { id: 'kaycee:mule', title: ['Pack Mule', 'Mula de carga'], where: ['Near the board, for round 2.', 'Cerca del tablero, para la ronda 2.'] },
  { id: 'kaycee:boss', title: ['The Limoncello', 'El Limoncello'], where: ['Near the board, for the third break.', 'Cerca del tablero, para el tercer descanso.'] },
  { id: 'pelts:pelts', title: ['Pelts', 'Pieles'], where: ['The pelt pile.', 'El montón de pieles.'] },
  { id: 'pelts:creatures', title: ['Pelt Lice', 'Piojos de piel'], where: ['K back: shuffled into the draw pile.', 'Dorso K: barajados en el mazo de robo.'], sharedBack: true },
  { id: 'pelts:items', title: ['Skinning Knife', 'Cuchillo de desollar'], where: ['Same back as the items: in the item pile.', 'Mismo dorso que los objetos: en el montón de objetos.'], sharedBack: true },
  { id: 'pelts:trials', title: ['Trial of Skins', 'Prueba de pieles'], where: ['Same back as the trials: with Leshy’s trials.', 'Mismo dorso que las pruebas: con las de Leshy.'], sharedBack: true },
];

export const DEATH_CARD_STEPS: T[] = [
  ['Shuffle the player’s dead pile and reveal 3 cards (under 9 cards in it: shuffle in their hand too). Pick the cost of one.', 'Baraja la pila de muertos del jugador y destapa 3 cartas (con menos de 9: baraja también su mano). Elige el coste de una.'],
  ['Reveal 3 more and pick one card’s power and health.', 'Destapa 3 más y elige el poder y la vida de una.'],
  ['Reveal 3 more and pick one card’s sigils. A Fledgling sigil gives +1 power and +2 health instead.', 'Destapa 3 más y elige los sellos de una. El sello Polluelo da en su lugar +1 de poder y +2 de vida.'],
  ['Write it on a blank card’s sleeve, draw a portrait and give it a name.', 'Escríbelo en la funda de una carta en blanco, dibuja un retrato y ponle nombre.'],
];
