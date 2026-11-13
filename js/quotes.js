// As 30 frases, na ordem dos dias. Cada uma foi localizada no texto da própria obra;
// `original` é o trecho como aparece na fonte conferida e `source` diz onde.
// Traduções para o português feitas a partir desses trechos.

const CAMUS = 'Albert Camus', KIERKEGAARD = 'Søren Kierkegaard', DOSTOIEVSKI = 'Fiódor Dostoiévski', SARTRE = 'Jean-Paul Sartre', KAFKA = 'Franz Kafka';

const TIPASA = 'Texto francês de «Retour à Tipasa» (L\'Été, Gallimard), conferido em reprodução da edição e em bordeaux-marche-de-la-poesie.fr/retour-tipasa/';
const CALIGULA = 'Texto francês de «Caligula» (Gallimard, Folio Théâtre), conferido em PDF da edição';
const OBRAS = 'Original dinamarquês de «Kjerlighedens Gjerninger» (1847), Søren Kierkegaards Skrifter, tekster.kb.dk/text/sks-kg-txt-root';
const KARAMAZOV = 'Tradução inglesa de Constance Garnett, Project Gutenberg nº 28054';
const CRIME = 'Tradução inglesa de Constance Garnett, Project Gutenberg nº 2554';
const NOITES = 'Tradução inglesa de Constance Garnett («White Nights and Other Stories»), Project Gutenberg nº 36034';
const EXIST = 'Texto francês da conferência «L\'existentialisme est un humanisme» (Nagel, 1946), conferido em PDF do texto integral';
const FELICE = 'Original alemão de «Briefe an Felice», edição online de Werner Haas, homepage.univie.ac.at/werner.haas';

export const QUOTES = [
  { author: CAMUS, work: 'Retorno a Tipasa', year: 1954,
    text: 'No meio do inverno, aprendi enfim que havia em mim um verão invencível.',
    original: 'Au milieu de l\'hiver, j\'apprenais enfin qu\'il y avait en moi un été invincible.', source: TIPASA },
  { author: KIERKEGAARD, work: 'As Obras do Amor', year: 1847,
    text: 'O amor tudo crê — e, no entanto, nunca é enganado.',
    original: 'Kjerlighed troer Alt – og bliver dog aldrig bedragen.', source: OBRAS + ' (2ª série, título do cap. II)' },
  { author: DOSTOIEVSKI, work: 'Crime e Castigo', year: 1866,
    text: 'O amor os ressuscitou: o coração de um continha fontes infinitas de vida para o coração do outro.',
    original: 'They were renewed by love; the heart of each held infinite sources of life for the heart of the other.', source: CRIME + ' (epílogo, II)' },
  { author: SARTRE, work: 'O Existencialismo é um Humanismo', year: 1946,
    text: 'Não há amor senão aquele que se constrói.',
    original: 'il n\'y a pas d\'amour autre que celui qui se construit', source: EXIST },
  { author: KAFKA, work: 'Cartas a Felice', year: 1912,
    text: 'Pronto, querida: as portas estão fechadas, há silêncio, estou de novo com você.',
    original: 'So Liebste, die Türen sind zu, es ist Stille, ich bin wieder bei Dir.', source: FELICE + ' (carta da noite de 15 para 16.12.1912)' },

  { author: CAMUS, work: 'Calígula', year: 1944,
    text: 'Amar um ser é aceitar envelhecer com ele.',
    original: 'Aimer un être, c\'est accepter de vieillir avec lui.', source: CALIGULA + ' (ato IV, cena XIII)' },
  { author: KIERKEGAARD, work: 'As Obras do Amor', year: 1847,
    text: 'O amor só pode e só quer ser tratado de um modo: sendo despertado pelo amor. E despertá-lo assim é edificar.',
    original: 'Thi Kjerlighed kan og vil kun behandles paa een Maade, ved at elskes frem; at elske den frem er at opbygge.', source: OBRAS + ' (2ª série, cap. I, «O amor edifica»)' },
  { author: DOSTOIEVSKI, work: 'Os Irmãos Karamázov', year: 1880,
    text: 'O amor ativo é trabalho e perseverança e, para alguns, talvez toda uma ciência.',
    original: 'But active love is labor and fortitude, and for some people too, perhaps, a complete science.', source: KARAMAZOV + ' (livro II, cap. 4)' },
  { author: SARTRE, work: 'O Existencialismo é um Humanismo', year: 1946,
    text: 'O homem não é nada além do que ele faz de si mesmo.',
    original: 'l\'homme n\'est rien d\'autre que ce qu\'il se fait', source: EXIST },
  { author: KAFKA, work: 'Cartas a Felice', year: 1912,
    text: 'Comecei a acreditar que em algum lugar, ainda que difícil de encontrar, deve haver uma boa estrela sob a qual se pode continuar vivendo.',
    original: 'ich fing zu glauben an, dass da irgendwo, wenn auch schwer aufzufinden, ein guter Stern sein müsse, unter dem man weiterleben könne.', source: FELICE + ' (carta de 1.11.1912)' },

  { author: CAMUS, work: 'Retorno a Tipasa', year: 1954,
    text: 'Há apenas falta de sorte em não ser amado; há infelicidade em não amar.',
    original: 'Car il y a seulement de la malchance à n\'être pas aimé : il y a du malheur à ne point aimer.', source: TIPASA },
  { author: KIERKEGAARD, work: 'As Obras do Amor', year: 1847,
    text: 'Qual é o bem supremo e a maior felicidade? Amar de verdade; e, depois disso, ser de verdade amado.',
    original: 'Hvad er nemlig det høieste Gode og den største Salighed? Dog vel det, i Sandhed at elske; næst dette, i Sandhed at blive elsket.', source: OBRAS + ' (2ª série, cap. II)' },
  { author: DOSTOIEVSKI, work: 'Crime e Castigo', year: 1866,
    text: 'Aqui começa uma nova história: a da renovação gradual de um homem, da sua passagem de um mundo a outro.',
    original: 'But that is the beginning of a new story—the story of the gradual renewal of a man, the story of his gradual regeneration, of his passing from one world into another', source: CRIME + ' (epílogo, II, último parágrafo)' },
  { author: SARTRE, work: 'O Existencialismo é um Humanismo', year: 1946,
    text: 'O sentimento se constrói pelos atos que praticamos.',
    original: 'le sentiment se construit par les actes qu\'on fait', source: EXIST },
  { author: KAFKA, work: 'Cartas a Felice', year: 1912,
    text: 'Basta eu pôr a mão no bolso e sentir o papel escrito por você, e sei: você pensa em mim, você vive para a minha felicidade.',
    original: 'ich muß nur die Hand in die Tasche stecken und fühle das von Dir beschriebene Papier und weiß, Du denkst an mich, Du lebst zu meinem Glück.', source: FELICE + ' (carta de 24.12.1912)' },

  { author: CAMUS, work: 'Calígula', year: 1944,
    text: 'Usa então o teu poder para amar melhor o que ainda pode ser amado. O que é possível também merece ter a sua chance.',
    original: 'Fais servir alors ton pouvoir à mieux aimer ce qui peut l\'être encore. Ce qui est possible mérite aussi d\'avoir sa chance.', source: CALIGULA + ' (ato I, fala de Cesônia)' },
  { author: KIERKEGAARD, work: 'As Obras do Amor', year: 1847,
    text: 'Enganar a si mesmo quanto ao amor é o mais terrível: uma perda eterna, para a qual não há reparação nem no tempo nem na eternidade.',
    original: 'At bedrage sig selv for Kjerlighed er det forfærdeligste, er et evigt Tab, for hvilket der ingen Erstatning er hverken i Tid eller i Evighed.', source: OBRAS + ' (1ª série, cap. I)' },
  { author: DOSTOIEVSKI, work: 'Noites Brancas', year: 1848,
    text: 'Meu Deus! Um momento inteiro de felicidade! Acaso isso é pouco, mesmo para toda a vida de um homem?',
    original: 'My God, a whole moment of happiness! Is that too little for the whole of a man\'s life?', source: NOITES + ' (última linha)' },
  { author: SARTRE, work: 'O Existencialismo é um Humanismo', year: 1946,
    text: 'Não há realidade senão na ação.',
    original: 'il n\'y a de réalité que dans l\'action', source: EXIST },
  { author: KAFKA, work: 'Cartas a Felice', year: 1913,
    text: 'Eu pertenço a você por inteiro; posso dizê-lo depois de olhar para toda a minha vida de trinta anos.',
    original: 'Ich gehöre Dir ganz und gar, das kann ich infolge des Überblickes sagen, den ich über mein 30jähriges Leben habe.', source: FELICE + ' (carta de 21.1.1913)' },

  { author: CAMUS, work: 'Retorno a Tipasa', year: 1954,
    text: 'Quando uma vez se teve a sorte de amar intensamente, a vida se passa a procurar de novo esse ardor e essa luz.',
    original: 'Quand une fois on a eu la chance d\'aimer fortement, la vie se passe à chercher de nouveau cette ardeur et cette lumière.', source: TIPASA },
  { author: KIERKEGAARD, work: 'As Obras do Amor', year: 1847,
    text: 'Como o lago tranquilo tem seu fundo em nascentes ocultas que nenhum olho viu, assim o amor de uma pessoa tem um fundo ainda mais profundo, no amor de Deus.',
    original: 'Som den stille Søe grunder dybt i de skjulte Kildevæld, hvilke intet Øie saae, saaledes grunder et Menneskes Kjerlighed endnu dybere, i Guds Kjerlighed.', source: OBRAS + ' (1ª série, cap. I)' },
  { author: DOSTOIEVSKI, work: 'Os Irmãos Karamázov', year: 1880,
    text: 'Amem o homem mesmo em seu pecado, pois esse é o mais alto amor sobre a terra.',
    original: 'Love a man even in his sin, for that is the semblance of Divine Love and is the highest love on earth.', source: KARAMAZOV + ' (livro VI, cap. 3)' },
  { author: SARTRE, work: 'O Existencialismo é um Humanismo', year: 1946,
    text: 'O homem não é nada além do seu projeto; só existe na medida em que se realiza.',
    original: 'l\'homme n\'est rien d\'autre que son projet, il n\'existe que dans la mesure où il se réalise', source: EXIST },
  { author: KAFKA, work: 'Cartas a Felice', year: 1912,
    text: 'Seria tão incrível que, depois de muitas tentativas, os fatos e os pressentimentos enfim se encontrem e se tornem uma única grande realidade, da qual se está sempre seguro?',
    original: 'wäre es dann so unglaublich, dass sie beide endlich nach vielen Proben zusammentreffen und eine einzige große Wirklichkeit werden, derer man immer sicher ist.', source: FELICE + ' (carta de 14.11.1912)' },

  { author: CAMUS, work: 'Retorno a Tipasa', year: 1954,
    text: 'Há duas sedes que não se pode enganar por muito tempo sem que o ser se resseque: amar e admirar.',
    original: 'les deux soifs qu\'on ne peut tromper longtemps sans que l\'être se dessèche, je veux dire aimer et admirer.', source: TIPASA },
  { author: KIERKEGAARD, work: 'As Obras do Amor', year: 1847,
    text: 'Quem ama permanece: permanece no amor, conserva-se no amor.',
    original: 'Den Kjerlige bliver, han bliver i Kjerligheden, bevarer sig selv i Kjerligheden', source: OBRAS + ' (2ª série, cap. VI, «O amor permanece»)' },
  { author: DOSTOIEVSKI, work: 'Os Irmãos Karamázov', year: 1880,
    text: 'O que é o inferno? É o sofrimento de já não poder amar.',
    original: '“What is hell?” I maintain that it is the suffering of being unable to love.', source: KARAMAZOV + ' (livro VI, cap. 3)' },
  { author: SARTRE, work: 'O Existencialismo é um Humanismo', year: 1946,
    text: 'Não há um só de nossos atos que, ao criar o homem que queremos ser, não crie ao mesmo tempo uma imagem do homem tal como julgamos que ele deve ser.',
    original: 'il n\'est pas un de nos actes qui, en créant l\'homme que nous voulons être, ne crée en même temps une image de l\'homme tel que nous estimons qu\'il doit être.', source: EXIST },
  { author: KAFKA, work: 'Cartas a Felice', year: 1912,
    text: 'Uma só palavra escrita por você poderia me fazer feliz.',
    original: 'Während ein geschriebenes Wort von Dir mich glücklich machen könnte!', source: FELICE + ' (carta de 20.11.1912)' },
];
