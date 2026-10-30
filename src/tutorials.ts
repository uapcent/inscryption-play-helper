/**
 * The card tutorials: each step is the whole table at that moment, so the player only moves what changed.
 * Pieces keep their `key` from step to step: same key, new place = the card slides there.
 */
import type { T } from './content';

const colX = (i: number) => 292 + i * 102;
const ROW_A = 50;
const ROW_B = 247;
const UP: [number, number] = [720, 50];
const DECK: [number, number] = [720, 247];

export interface Piece {
  key: string;
  /** A card from faces.json. */
  face?: string;
  /** A pile: this back, with a label. */
  back?: string;
  label?: T;
  x: number;
  y: number;
  /** Hearts left; by default the card's health. */
  hearts?: number;
  /** Power right now, when it depends on the table. */
  power?: string;
  badge?: string | T;
  on?: boolean;
}
export interface Step {
  text: T;
  pieces: Piece[];
  /** Strikes to show: a column, going up from your row (0) or down from the adversary's (1). */
  hits?: [number, 0 | 1][];
  /** A d20 that lands on this. */
  roll?: number;
}
export interface Tutorial { id: string; title: T; steps: Step[]; lines?: boolean }

const c = (key: string, face: string, col: number, row: 0 | 1, extra: Partial<Piece> = {}): Piece => ({ key, face, x: colX(col), y: row === 0 ? ROW_A : ROW_B, ...extra });
const hand = (key: string, face: string, i: number, extra: Partial<Piece> = {}): Piece => ({ key, face, x: colX(i), y: 404, hearts: 0, ...extra });
const up = (extra: Partial<Piece> = {}): Piece => ({ key: 'upgrades', back: 'upgrade', label: ['Upgrades', 'Mejoras'], x: UP[0], y: UP[1], ...extra });
const swaps = (extra: Partial<Piece> = {}): Piece => ({ key: 'swaps', back: 'swap', label: ['Swaps', 'Intercambios'], x: UP[0], y: UP[1], ...extra });
const deck = (extra: Partial<Piece> = {}): Piece => ({ key: 'deck', back: 'common', label: ['Your deck', 'Tu mazo'], x: DECK[0], y: DECK[1], ...extra });
const dead = (key: string, face: string): Piece => ({ key, face, x: 820, y: ROW_B, hearts: 0 });
const backCard = (key: string, x: number, y: number): Piece => ({ key, back: 'common', x, y });

export const TUTORIALS: Tutorial[] = [
  {
    id: 'evolution',
    title: ['Evolutions', 'Evoluciones'],
    lines: true,
    steps: [
      { text: ['You play a Raven Egg: 0 power, 2 health, and the Fledgling sigil. It only has to survive until your next turn.', 'Juegas un Huevo de cuervo: 0 de poder, 2 de vida y el sello Polluelo. Solo tiene que sobrevivir hasta tu siguiente turno.'], pieces: [c('card', 'raven_egg', 1, 1, { on: true }), c('foe', 'stoat', 1, 0), up()] },
      { text: ['The adversary’s Stoat strikes it for 1. The egg survives with 1 heart left.', 'El Armiño del adversario lo golpea y le hace 1. El huevo sobrevive con 1 corazón.'], pieces: [c('card', 'raven_egg', 1, 1, { hearts: 1 }), c('foe', 'stoat', 1, 0, { on: true }), up()], hits: [[1, 1]] },
      { text: ['Start of your next turn: it grows. Take the Raven from the Upgrades pile and put it over the egg. **Its health is replaced as if it were a brand new card, so the damage is healed:** 3 full hearts.', 'Al empezar tu siguiente turno, crece. Coge el Cuervo del montón de mejoras y ponlo sobre el huevo. **Su vida se repone como si fuera una carta nueva, así que el daño se cura:** 3 corazones.'], pieces: [c('card', 'raven__upgrade_pile', 1, 1, { on: true }), c('foe', 'stoat', 1, 0), up()] },
      { text: ['When a grown card leaves the board, the Raven goes back to the Upgrades pile and the egg to your dead pile. Next time, it has to grow again.', 'Cuando una carta crecida sale del tablero, el Cuervo vuelve al montón de mejoras y el huevo a tu pila de muertos. La próxima vez tendrá que volver a crecer.'], pieces: [dead('card', 'raven_egg'), c('foe', 'stoat', 1, 0), up({ on: true })] },
    ],
  },
  {
    id: 'ijiraq',
    title: ['Ijiraq', 'Ijiraq'],
    steps: [
      { text: ['Ijiraq hides in your deck, face up. So you always see it coming. Here it’s the third card down.', 'Ijiraq se esconde en tu mazo, boca arriba. Así siempre lo ves venir. Aquí es la tercera carta.'], pieces: [backCard('a', colX(0), ROW_B), backCard('b', colX(1), ROW_B), c('ijiraq', 'ijiraq', 2, 1, { hearts: 0, on: true }), backCard('d', colX(3), ROW_B)] },
      { text: ['Whenever your deck is shuffled (at the start of each round, or for a trial), take Ijiraq out first and shuffle the rest.', 'Cada vez que barajas tu mazo (al empezar cada ronda, o para una prueba), saca primero a Ijiraq y baraja el resto.'], pieces: [deck(), c('ijiraq', 'ijiraq', 1, 0, { hearts: 0, on: true })] },
      { text: ['Then **the other player** slips it back into your deck, wherever they like.', 'Después **el otro jugador** lo mete de nuevo en tu mazo, donde quiera.'], pieces: [deck({ on: true }), { key: 'ijiraq', face: 'ijiraq', x: DECK[0] - 54, y: DECK[1] - 20, hearts: 0 }] },
      { text: ['Later, Ijiraq is on top of your deck, with a Wolf under it, and you choose to draw a creature card. You draw Ijiraq, disguised as the Wolf. The Wolf stays on top of your deck.', 'Más adelante, Ijiraq está encima de tu mazo, con un Lobo debajo, y eliges robar una carta de criatura. Robas a Ijiraq, disfrazado de Lobo. El Lobo se queda encima de tu mazo.'], pieces: [deck(), { key: 'under', face: 'wolf', x: DECK[0], y: DECK[1], hearts: 0, on: true }, hand('ijiraq', 'ijiraq', 1, { on: true })] },
      { text: ['Its cost is the disguise’s: a Wolf costs 2 blood, so you sacrifice 2 cards to play it. If the card under it had cost bones, you’d pay those bones.', 'Su coste es el del disfraz: un Lobo cuesta 2 de sangre, así que sacrificas 2 cartas para jugarlo. Si la carta de debajo costara huesos, pagarías esos huesos.'], pieces: [deck(), { key: 'under', face: 'wolf', x: DECK[0], y: DECK[1], hearts: 0 }, hand('ijiraq', 'ijiraq', 1), c('s1', 'squirrels', 0, 1, { on: true }), c('s2', 'squirrels', 2, 1, { on: true })] },
      { text: ['**Only the cost changes.** On the board, Ijiraq is itself: 4 power, 1 health and its own sigil, Repulsive. The card across from it refuses to attack.', '**Solo cambia el coste.** En el tablero, Ijiraq es él mismo: 4 de poder, 1 de vida y su propio sello, Repulsivo. La carta de enfrente se niega a atacar.'], pieces: [deck(), { key: 'under', face: 'wolf', x: DECK[0], y: DECK[1], hearts: 0 }, c('ijiraq', 'ijiraq', 1, 1, { on: true }), c('foe', 'stoat', 1, 0)] },
    ],
  },
  {
    id: 'child13',
    title: ['Child 13', 'Niña 13'],
    steps: [
      { text: ['Child 13 sleeps on your side: 0 power, 1 health, Many Lives. You want to play a Stoat, which costs 1 blood.', 'La Niña 13 duerme en tu lado: 0 de poder, 1 de vida, Muchas vidas. Quieres jugar un Armiño, que cuesta 1 de sangre.'], pieces: [c('child', 'child_13', 1, 1, { on: true }), hand('stoat', 'stoat', 1), up()] },
      { text: ['You sacrifice it. Many Lives keeps it on the board, and it wakes: swap it for its flying version from the Upgrades pile, with 2 power and Airborne.', 'La sacrificas. Muchas vidas la mantiene en el tablero, y despierta: cámbiala por su versión voladora del montón de mejoras, con 2 de poder y Aéreo.'], pieces: [c('child', 'child_13_awake', 1, 1, { on: true }), c('stoat', 'stoat', 2, 1), up({ on: true })] },
      { text: ['After each sacrifice, roll the d20. Anything but a 13: nothing else happens.', 'Tras cada sacrificio, tira el d20. Cualquier cosa menos un 13: no pasa nada más.'], pieces: [c('child', 'child_13_awake', 1, 1), c('stoat', 'stoat', 2, 1), up()], roll: 8 },
      { text: ['Sacrifice it again and it goes back to sleep, and you roll again. This time, a 13.', 'Sacrifícala otra vez y vuelve a dormirse, y tiras otra vez. Esta vez, un 13.'], pieces: [c('child', 'child_13', 1, 1, { on: true }), c('stoat', 'stoat', 2, 1), up()], roll: 13 },
      { text: ['It becomes the Hungry Child **for the rest of the round**. It stays in its space and can’t be killed, but it doesn’t block: a strike at its space goes straight to you.', 'Se convierte en la Niña hambrienta **durante el resto de la ronda**. Se queda en su espacio y no se la puede matar, pero no bloquea: un golpe a su espacio te da directamente a ti.'], pieces: [c('child', 'hungry_child', 1, 1, { hearts: 0, on: true }), c('stoat', 'stoat', 2, 1), c('foe', 'wolf', 1, 0), up()], hits: [[1, 1]] },
      { text: ['Next round you get Child 13 back, asleep.', 'En la siguiente ronda recuperas a la Niña 13, dormida.'], pieces: [hand('child', 'child_13', 1, { on: true }), up()] },
    ],
  },
  {
    id: 'wiseclock',
    title: ['Wiseclock', 'Reloj mecánico'],
    steps: [
      { text: ['The board before using it. Your row is the near one.', 'El tablero antes de usarlo. Tu fila es la de cerca.'], pieces: [c('stoat', 'stoat', 0, 1), c('wolf', 'wolf', 2, 1), c('adder', 'adder', 1, 0), c('raven', 'raven', 3, 0)] },
      { text: ['Every card moves one space clockwise, seen with your row at the bottom. Your cards move left and your adversary’s move right.', 'Todas las cartas se mueven un espacio en el sentido de las agujas del reloj, visto con tu fila abajo. Tus cartas se mueven a la izquierda y las de tu adversario a la derecha.'], pieces: [c('stoat', 'stoat', 0, 0, { on: true }), c('wolf', 'wolf', 1, 1), c('adder', 'adder', 2, 0), c('raven', 'raven', 3, 1, { on: true })] },
      { text: ['Your leftmost card goes up to your adversary’s leftmost space, and their rightmost comes down to your rightmost. **A card that changes rows now belongs to that row’s player:** your Stoat is theirs, their Raven is yours.', 'Tu carta de más a la izquierda sube al espacio de más a la izquierda de tu adversario, y su carta de más a la derecha baja a tu espacio de más a la derecha. **Una carta que cambia de fila pasa a ser del jugador de esa fila:** tu Armiño es suyo y su Cuervo es tuyo.'], pieces: [c('stoat', 'stoat', 0, 0, { on: true }), c('wolf', 'wolf', 1, 1), c('adder', 'adder', 2, 0), c('raven', 'raven', 3, 1, { on: true })] },
    ],
  },
  {
    id: 'hydra',
    title: ['Curious Egg and Hydra', 'Huevo curioso e Hidra'],
    steps: [
      { text: ['The Curious Egg waits on your side. It hatches when there’s a card of each tribe on the board, counting both sides: bird, canine, hooved, insect and reptile.', 'El Huevo curioso espera en tu lado. Eclosiona cuando en el tablero, contando los dos lados, hay una carta de cada tribu: pájaro, cánido, ungulado, insecto y reptil.'], pieces: [c('egg', 'curious_egg', 1, 1, { on: true }), c('t1', 'raven', 0, 1), c('t2', 'wolf', 3, 1), c('t3', 'elk', 0, 0), c('t4', 'mantis', 2, 0)] },
      { text: ['The adversary plays an Adder, a reptile: that’s all five. Amalgam counts as every tribe.', 'El adversario juega una Víbora, un reptil: ya están las cinco. La Amalgama cuenta como todas las tribus.'], pieces: [c('egg', 'curious_egg', 1, 1), c('t1', 'raven', 0, 1), c('t2', 'wolf', 3, 1), c('t3', 'elk', 0, 0), c('t4', 'mantis', 2, 0), c('t5', 'adder', 3, 0, { on: true })] },
      { text: ['The egg hatches into the Hydra, from the Upgrades pile.', 'El huevo eclosiona en la Hidra, del montón de mejoras.'], pieces: [c('egg', 'hydra__upgrade_pile', 1, 1, { on: true }), c('t1', 'raven', 0, 1), c('t2', 'wolf', 3, 1), c('t3', 'elk', 0, 0), c('t4', 'mantis', 2, 0), c('t5', 'adder', 3, 0)] },
      { text: ['Bifurcated and Trifurcated Strike together: it strikes twice to the left, once in the middle and twice to the right.', 'Golpe bifurcado y trifurcado juntos: golpea dos veces a la izquierda, una en el centro y dos a la derecha.'], pieces: [c('egg', 'hydra__upgrade_pile', 1, 1, { on: true }), c('t3', 'elk', 0, 0, { badge: '×2' }), c('t4', 'mantis', 2, 0, { badge: '×2' }), c('t5', 'adder', 3, 0)], hits: [[0, 0], [1, 0], [2, 0]] },
    ],
  },
  {
    id: 'daus',
    title: ['The Daus and its Chimes', 'El Daus y sus Campanillas'],
    steps: [
      { text: ['When played, a Chime goes in each free space beside The Daus. Chimes can’t be sacrificed.', 'Al jugarlo, se pone una Campanilla en cada espacio libre a su lado. Las Campanillas no se pueden sacrificar.'], pieces: [c('daus', 'the_daus', 1, 1, { on: true }), c('ch1', 'chime__swap_pile', 0, 1, { hearts: 0 }), c('ch2', 'chime__swap_pile', 2, 1, { hearts: 0 }), c('foe', 'wolf', 0, 0)] },
      { text: ['If a Chime is damaged, The Daus deals 2 damage to the attacking card, wherever it is. This Wolf has 2 health, so striking the Chime kills it.', 'Si dañan a una Campanilla, El Daus hace 2 de daño a la carta atacante, esté donde esté. Este Lobo tiene 2 de vida, así que golpear la Campanilla lo mata.'], pieces: [c('daus', 'the_daus', 1, 1, { on: true }), c('ch1', 'chime__swap_pile', 0, 1, { hearts: 0 }), c('ch2', 'chime__swap_pile', 2, 1, { hearts: 0 }), c('foe', 'wolf', 0, 0, { hearts: 0, on: true })], hits: [[0, 1]] },
    ],
  },
  {
    id: 'longelk',
    title: ['Long Elk', 'Uapití largo'],
    steps: [
      { text: ['Long Elk moves like a Sprinter: one space after your turn, turning around at the edge.', 'El Uapití largo se mueve como un Velocista: un espacio después de tu turno, dándose la vuelta en el borde.'], pieces: [c('elk', 'long_elk', 1, 1, { on: true })] },
      { text: ['Every time it moves, it leaves a Vertebrae in the space it left. Vertebrae are swap cards and can be sacrificed.', 'Cada vez que se mueve, deja una Vértebra en el espacio que abandona. Las Vértebras son cartas de intercambio y se pueden sacrificar.'], pieces: [c('elk', 'long_elk', 2, 1), c('v1', 'vertebrae__swap_pile', 1, 1, { on: true })] },
    ],
  },
  {
    id: 'cuckoo',
    title: ['Cuckoo', 'Cuco'],
    steps: [
      { text: ['When played, an egg goes in the space across from it, if it’s empty. Roll the d20: only a 1 or a 2 gives a Raven Egg.', 'Al jugarlo, se pone un huevo en el espacio de enfrente, si está vacío. Tira el d20: solo un 1 o un 2 da un Huevo de cuervo.'], pieces: [c('cuckoo', 'cuckoo', 1, 1, { on: true })], roll: 14 },
      { text: ['Any other roll: a Broken Egg. It belongs to the adversary, and it’s in the way.', 'Con cualquier otro resultado: un Huevo roto. Es del adversario, y estorba.'], pieces: [c('cuckoo', 'cuckoo', 1, 1), c('egg', 'broken_egg__swap_pile', 1, 0, { on: true })] },
      { text: ['On a 1 or a 2: a Raven Egg, also the adversary’s. It can grow, and **the Raven stays theirs**.', 'Con un 1 o un 2: un Huevo de cuervo, también del adversario. Puede crecer, y **el Cuervo sigue siendo suyo**.'], pieces: [c('cuckoo', 'cuckoo', 1, 1), c('egg', 'raven_egg__swap_pile', 1, 0, { on: true })], roll: 2 },
    ],
  },
  {
    id: 'kraken',
    title: ['Great Kraken', 'Gran kraken'],
    steps: [
      { text: ['Waterborne: on the adversary’s turn it’s face down, so attacks on its space hit you directly.', 'Acuático: en el turno del adversario está boca abajo, así que los ataques a su espacio te golpean directamente.'], pieces: [{ key: 'kraken', back: 'submerge', x: colX(1), y: ROW_B, on: true }, c('foe', 'wolf', 1, 0)], hits: [[1, 1]] },
      { text: ['When it comes back up, it turns into a random tentacle: shuffle the tentacles of the Swaps pile face down and take one.', 'Cuando vuelve a salir, se convierte en un tentáculo al azar: baraja boca abajo los tentáculos del montón de intercambios y coge uno.'], pieces: [c('kraken', 'bell_tentacle', 1, 1, { on: true }), c('foe', 'wolf', 1, 0), swaps({ on: true })] },
    ],
  },
  {
    id: 'turtle',
    title: ['Mud Turtle', 'Tortuga de lodo'],
    steps: [
      { text: ['Armored: the first time it would take damage, the damage is blocked.', 'Blindado: la primera vez que fuera a recibir daño, el daño se bloquea.'], pieces: [c('t', 'mud_turtle', 1, 1, { on: true }), c('foe', 'wolf', 1, 0), swaps()], hits: [[1, 1]] },
      { text: ['Its shell is gone: swap it for the Mud Turtle without its shell, from the Swaps pile. The next hit counts.', 'Se queda sin caparazón: cámbiala por la Tortuga de lodo sin caparazón, del montón de intercambios. El siguiente golpe cuenta.'], pieces: [c('t', 'mud_turtle__swap_pile', 1, 1, { on: true }), c('foe', 'wolf', 1, 0), swaps({ on: true })] },
    ],
  },
  {
    id: 'ouroboros',
    title: ['Ouroboros', 'Ouroboros'],
    steps: [
      { text: ['Reborn: when it dies, it returns to your hand.', 'Renacido: cuando muere, vuelve a tu mano.'], pieces: [c('o', 'ouroboros', 1, 1, { hearts: 0 }), c('foe', 'wolf', 1, 0)], hits: [[1, 1]] },
      { text: ['Each time, it gains +1 power and +1 health. Keep its growth with tokens behind the card. It resets every full game, not every round.', 'Cada vez gana +1 de poder y +1 de vida. Lleva la cuenta con fichas detrás de la carta. Se reinicia en cada partida, no en cada ronda.'], pieces: [hand('o', 'ouroboros', 1, { on: true, badge: '+1 / +1' }), c('foe', 'wolf', 1, 0)] },
    ],
  },
  {
    id: 'cat',
    title: ['Cat', 'Gato'],
    steps: [
      { text: ['Many Lives: when sacrificed, the Cat stays on the board. So you can pay with it and keep it.', 'Muchas vidas: al sacrificarlo, el Gato se queda en el tablero. Así puedes pagar con él y conservarlo.'], pieces: [c('cat', 'cat', 1, 1, { on: true }), hand('s', 'stoat', 1)] },
      { text: ['With Kaycee’s Mod, roll the d20 after each sacrifice. On a 7 it becomes the Undead Cat: strong, without Many Lives. Without the expansion, the optional rule counts 9 sacrifices with a bone behind the card.', 'Con Kaycee’s Mod, tira el d20 tras cada sacrificio. Con un 7 se convierte en el Gato no muerto: fuerte, sin Muchas vidas. Sin la expansión, la regla opcional cuenta 9 sacrificios con un hueso detrás de la carta.'], pieces: [c('cat', 'undead_cat', 1, 1, { on: true }), c('s', 'stoat', 2, 1)], roll: 7 },
      { text: ['It’s **only for that round**. Next round you get the Cat back.', 'Es **solo durante esa ronda**. En la siguiente ronda recuperas al Gato.'], pieces: [hand('cat', 'cat', 1, { on: true })] },
    ],
  },
  {
    id: 'tentacles',
    title: ['The tentacles', 'Los tentáculos'],
    steps: [
      { text: ['Bell Tentacle: its power depends on how close it is to the bell. 4 in the closest space, down to 1 in the farthest.', 'Tentáculo campana: su poder depende de lo cerca que esté de la campana. 4 en el espacio más cercano, hasta 1 en el más lejano.'], pieces: [c('t', 'bell_tentacle', 0, 1, { power: '4', on: true })] },
      { text: ['In the farthest space, only 1.', 'En el espacio más lejano, solo 1.'], pieces: [c('t', 'bell_tentacle', 3, 1, { power: '1', on: true })] },
      { text: ['Hand Tentacle: its power is the number of cards in your hand. Three cards: 3 power.', 'Pulpo mano: su poder es el número de cartas en tu mano. Tres cartas: 3 de poder.'], pieces: [c('t', 'hand_tentacle', 1, 1, { power: '3', on: true }), hand('h1', 'squirrels', 0), hand('h2', 'stoat', 1), hand('h3', 'wolf', 2)] },
      { text: ['Mirror Tentacle: its power is the power of the card across from it, or 0 if there’s none.', 'Pulpo espejo: su poder es el de la carta de enfrente, o 0 si no hay ninguna.'], pieces: [c('t', 'mirror_tentacle', 1, 1, { power: '3', on: true }), c('foe', 'wolf', 1, 0)] },
    ],
  },
  {
    id: 'ants',
    title: ['Ants', 'Hormigas'],
    steps: [
      { text: ['Ant Damage: its power is the number of your Ants in play. One Worker Ant alone: 1.', 'Daño de hormigas: su poder es el número de Hormigas tuyas en juego. Una Hormiga obrera sola: 1.'], pieces: [c('a1', 'worker_ant', 0, 1, { power: '1', on: true })] },
      { text: ['Every Ant counts for all of them. The Ant Queen also puts an Ant from the Swaps pile into your hand when played.', 'Cada Hormiga cuenta para todas. La Hormiga reina además pone en tu mano una Hormiga del montón de intercambios al jugarla.'], pieces: [c('a1', 'worker_ant', 0, 1, { power: '2' }), c('q', 'ant_queen', 1, 1, { power: '2', on: true }), hand('a2', 'worker_ant', 1, { on: true }), swaps()] },
      { text: ['Three Ants: each one has 3 power.', 'Tres Hormigas: cada una tiene 3 de poder.'], pieces: [c('a1', 'worker_ant', 0, 1, { power: '3', on: true }), c('q', 'ant_queen', 1, 1, { power: '3', on: true }), c('a2', 'worker_ant', 2, 1, { power: '3', on: true }), swaps()] },
    ],
  },
  {
    id: 'amoeba',
    title: ['Amoeba', 'Ameba'],
    steps: [
      { text: ['Amorphous: when played, turn over cards from the shared draw pile until one has a single sigil. A Stoat has none: keep going.', 'Amorfo: al jugarla, destapa cartas del mazo de robo común hasta que una tenga un solo sello. Un Armiño no tiene ninguno: sigue.'], pieces: [c('am', 'amoeba', 1, 1, { on: true }), c('r1', 'stoat', 0, 0, { hearts: 0 })] },
      { text: ['An Elk Fawn has two: keep going.', 'Un Alce cervatillo tiene dos: sigue.'], pieces: [c('am', 'amoeba', 1, 1), c('r1', 'stoat', 0, 0, { hearts: 0 }), c('r2', 'elk_fawn', 1, 0, { hearts: 0, on: true })] },
      { text: ['A Sparrow has only Airborne: the Amoeba gains it.', 'Un Gorrión solo tiene Aéreo: la Ameba lo gana.'], pieces: [c('am', 'amoeba', 1, 1, { on: true, badge: ['+ Airborne', '+ Aéreo'] }), c('r1', 'stoat', 0, 0, { hearts: 0 }), c('r2', 'elk_fawn', 1, 0, { hearts: 0 }), c('r3', 'sparrow', 2, 0, { hearts: 0, on: true })] },
    ],
  },
  {
    id: 'lice',
    title: ['Pelt Lice', 'Piojos de piel'],
    steps: [
      { text: ['Stowaway: you play a pelt, with Pelt Lice in your hand and in your deck.', 'Polizón: juegas una piel, con Piojos de piel en tu mano y en tu mazo.'], pieces: [c('p', 'rabbit_pelt__swap_pile', 0, 1, { hearts: 0, on: true }), hand('l1', 'pelt_lice_new_sigil', 1), deck()] },
      { text: ['Every Pelt Lice in your hand or deck plays itself for free into an empty space you choose. Then shuffle your deck. The ones without room wait for your next pelt.', 'Todos los Piojos de piel de tu mano o de tu mazo se juegan solos, gratis, en espacios vacíos que elijas. Después baraja tu mazo. Los que no caben esperan a tu siguiente piel.'], pieces: [c('p', 'rabbit_pelt__swap_pile', 0, 1, { hearts: 0 }), c('l1', 'pelt_lice_new_sigil', 1, 1, { on: true }), c('l2', 'pelt_lice_new_sigil', 2, 1, { on: true }), deck()] },
    ],
  },
  {
    id: 'hook',
    title: ['Fish Hook', 'Anzuelo'],
    steps: [
      { text: ['Take one of your adversary’s cards for this round, rare cards too. You need an empty space on your side to put it in.', 'Quédate durante esta ronda una de las cartas de tu adversario, también las raras. Necesitas un espacio vacío en tu lado para ponerla.'], pieces: [c('w', 'wolf', 2, 0, { on: true }), c('m', 'stoat', 0, 1)] },
      { text: ['It fights for you now, but it still belongs to its owner.', 'Ahora lucha para ti, pero sigue siendo de su dueño.'], pieces: [c('w', 'wolf', 2, 1, { on: true }), c('m', 'stoat', 0, 1)] },
      { text: ['When it leaves the board, even if it dies on your side, it goes to its owner’s dead pile. If it dies, you get the bone.', 'Cuando sale del tablero, aunque muera en tu lado, va a la pila de muertos de su dueño. Si muere, tú recibes el hueso.'], pieces: [{ key: 'w', face: 'wolf', x: 820, y: ROW_A, hearts: 0, on: true }, c('m', 'stoat', 0, 1)] },
    ],
  },
  {
    id: 'knife',
    title: ['Skinning Knife', 'Cuchillo de desollar'],
    steps: [
      { text: ['Skin any card on the board, yours or your adversary’s. It leaves the game for good: no dead pile and no bones.', 'Desuella cualquier carta del tablero, tuya o de tu adversario. Sale de la partida para siempre: sin pila de muertos y sin huesos.'], pieces: [c('v', 'wolf', 1, 0, { on: true }), c('m', 'stoat', 0, 1)] },
      { text: ['Its owner gets its pelt in hand: Golden for a rare card, Wolf for a card with sigils, Rabbit for any other. This Wolf has no sigils: a Rabbit Pelt.', 'Su dueño recibe su piel en la mano: Dorada si es rara, de Lobo si tiene sellos, de Conejo si no. Este Lobo no tiene sellos: una Piel de conejo.'], pieces: [{ key: 'v', face: 'rabbit_pelt__swap_pile', x: colX(1), y: ROW_A, hearts: 0, on: true }, c('m', 'stoat', 0, 1)] },
    ],
  },
  {
    id: 'cages',
    title: ['Caged Wolf and Frozen Opossum', 'Lobo enjaulado y Zarigüeya congelada'],
    steps: [
      { text: ['Placed on the board for free: a Caged Wolf has 0 power and 3 health, a Frozen Opossum 0 power and 5 health. They block.', 'Se colocan en el tablero gratis: un Lobo enjaulado tiene 0 de poder y 3 de vida, una Zarigüeya congelada 0 de poder y 5 de vida. Bloquean.'], pieces: [c('w', 'caged_wolf', 0, 1, { on: true }), c('o', 'frozen_opossum', 2, 1, { on: true }), c('foe', 'wolf', 0, 0)], hits: [[0, 1]] },
      { text: ['When one dies, its creature takes its space: a Wolf from the Upgrades pile, an Opossum from the Swaps pile.', 'Cuando una muere, su criatura ocupa su lugar: un Lobo del montón de mejoras, una Zarigüeya del montón de intercambios.'], pieces: [c('w', 'wolf__upgrade_pile', 0, 1, { on: true }), c('o', 'opossum', 2, 1, { on: true }), c('foe', 'wolf', 0, 0)] },
    ],
  },
];

export const tutorialById = (id: string) => TUTORIALS.find((tu) => tu.id === id);

/** What grows into what, with `kaycee` for the expansion's. */
export const EVOLUTION_LINES: { line: T; kaycee?: boolean }[] = [
  { line: ['Raven Egg → Raven', 'Huevo de cuervo → Cuervo'] },
  { line: ['Wolf Cub → Wolf', 'Lobato → Lobo'] },
  { line: ['Elk Fawn → Elk', 'Alce cervatillo → Alce'] },
  { line: ['Strange Larva → Strange Pupa → Mothman', 'Larva extraña → Pupa extraña → Hombre polilla'] },
  { line: ['Tadpole → Bullfrog', 'Renacuajo → Rana toro'], kaycee: true },
  { line: ['Dire Wolf Pup → Dire Wolf', 'Lobezno gigante → Lobo gigante'], kaycee: true },
  { line: ['Cuckoo’s Raven Egg → Raven (the adversary’s)', 'Huevo de cuervo del Cuco → Cuervo (del adversario)'], kaycee: true },
];
