export function createGame({ mount, sdk, ready, tweaks, assets }) {
  let cleanup = () => {};

  // Coordenadas das fontes dos avatares no ATLAS
  const ATLAS_FRAMES = {
    julia: { x: 56, y: 56, w: 320, h: 320 },
    lucas: { x: 440, y: 56, w: 320, h: 320 },
    mariana: { x: 824, y: 56, w: 320, h: 320 },
    marcos: { x: 248, y: 440, w: 320, h: 320 },
    mateus: { x: 632, y: 440, w: 320, h: 320 }
  };

  // Configurações do jogo baseadas em tweaks e defaults
  let respect = tweaks.get("initialRespect") ?? 50;
  let empathy = tweaks.get("initialEmpathy") ?? 50;
  let awareness = tweaks.get("initialAwareness") ?? 40;
  let bestScore = 0;

  // Contador de Respostas Corretas e Erradas
  let correctAnswers = 0;
  let incorrectAnswers = 0;

  // Estatísticas acumuladas de escolhas (banco de dados simulado + escolhas reais persistidas)
  let statsDatabase = {
    chap1: { A: 120, B: 245, C: 635 },
    chap2: { A: 185, B: 310, C: 505 },
    chap3: { A: 140, B: 280, C: 580 },
    chap4: { A: 130, B: 210, C: 660 },
    chap5: { A: 155, B: 290, C: 555 },
    chap6: { A: 165, B: 190, C: 645 },
    chap7: { A: 110, B: 240, C: 650 }
  };

  // URLs de Assets predefinidos
  const schoolBgUrl = assets ? assets.get("SCHOOL_BG") : "/generated-assets/school_bg.webp";
  const chalkboardBgUrl = assets ? assets.get("CHALKBOARD_BG") : "/generated-assets/chalkboard_bg-transparent.webp";
  const classroomBgUrl = assets ? assets.get("SALA_BG") : "/generated-assets/sala_bg.webp";
  const sportsBgUrl = assets ? assets.get("QUADRA_BG") : "/generated-assets/quadra_bg.webp";
  const characterAtlasUrl = assets ? assets.get("CHARACTER_ATLAS") : "/generated-assets/character_atlas-transparent.webp";
  const ambientMusicUrl = assets ? assets.get("AMBIENT_MUSIC") : null;

  // Imagens precarregadas
  let images = {
    schoolBg: null,
    chalkboardBg: null,
    classroomBg: null,
    sportsBg: null,
    characterAtlas: null
  };

  // Instância de Áudio
  let bgMusic = null;
  let audioContext = null;

  // Roteiro do Jogo (7 Capítulos com cenários específicos e personagens fardados)
  const chapters = [
    {
      id: 1,
      title: "Capítulo 1: Júlia",
      subtitle: "Conquista de Espaço",
      bgUrl: sportsBgUrl, // Quadra de Esportes!
      bgKey: "sportsBg",
      char: "julia",
      desc: "Júlia quer entrar para o time de Futebol da escola para o campeonato intercolegial, mas enfrenta preconceitos sobre o papel de meninas no esporte.",
      steps: [
        {
          type: "narrator",
          text: "Júlia está na quadra de esportes da escola, muito animada assistindo ao treino de futsal masculino. Ela é uma excelente jogadora."
        },
        {
          type: "dialogue",
          speaker: "Júlia",
          avatar: "julia",
          text: "Nossa, esse campeonato de futsal é a minha chance de jogar sério! Já treinei muito e sei exatamente como posso ajudar o time."
        },
        {
          type: "narrator",
          text: "Ao ir falar com Marcos, o capitão do time, Júlia pede para se inscrever na equipe."
        },
        {
          type: "dialogue",
          speaker: "Marcos",
          avatar: "marcos",
          text: "Ué, Júlia? Futebol é meio violento e pesado... Não prefere ajudar a nossa equipe sendo líder de torcida, entregando água ou cuidando do nosso Instagram? É bem mais a sua cara!"
        },
        {
          type: "choice",
          prompt: "Como Júlia deve responder para lidar com essa opinião machista?",
          choices: [
            {
              option: "A",
              text: "Ceder ao comentário: 'Ah, pode ser... Acho que futebol é muito bruto para mim mesmo. Fico com as redes sociais da equipe.'",
              stats: { respect: -10, empathy: -10, awareness: -15 },
              feedback: {
                title: "Estereótipo de Gênero nos Esportes",
                text: "Ao ceder, Júlia se afasta de uma atividade que ama por causa de uma barreira social e machista de que meninas devem ser apenas decorativas ou ajudantes. Isso reforça a exclusão e o silenciamento.",
                nextStep: "dialog_julia_ceded"
              }
            },
            {
              option: "B",
              text: "Reagir com agressividade: 'Que besteira! Sou muito melhor de bola do que você e metade desse time de perna de pau. Quem é você para me barrar?'",
              stats: { respect: +5, empathy: -5, awareness: +5 },
              feedback: {
                title: "Reação Defensiva e Conflito",
                text: "A raiva de Júlia é legítima frente ao machismo, mas reagir de forma ríspida faz com que Marcos se coloque na defensiva e a rotule de 'exagerada' ou 'estressada', perdendo a oportunidade de fazê-lo refletir.",
                nextStep: "dialog_julia_angry"
              }
            },
            {
              option: "C",
              text: "Posicionar-se com firmeza e fatos: 'Marcos, a capacidade atlética não tem relação com gênero. Eu treino sério, sou rápida e posso fortalecer muito o ataque do time. Vamos fazer um teste prático na quadra?'",
              stats: { respect: +20, empathy: +15, awareness: +20 },
              feedback: {
                title: "Assertividade e Conquista de Espaço",
                text: "Excelente! Posicionar-se de forma assertiva desconstrói o estereótipo diretamente. Júlia afirma sua competência esportiva e exige igualdade de oportunidades, provando seu valor técnico pelo mérito.",
                nextStep: "dialog_julia_constructive"
              }
            }
          ]
        }
      ],
      reactions: {
        dialog_julia_ceded: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Isso aí, Júlia! Vai ser ótimo ter você de líder de torcida animando a gente!" },
          { type: "dialogue", speaker: "Júlia", avatar: "julia", text: "(Triste)... É, acho que futebol é coisa de menino mesmo." }
        ],
        dialog_julia_angry: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Eita, Júlia! Que mau humor! Não precisa apelar, só fiz uma crítica. Viu como garotas são descontroladas?" },
          { type: "dialogue", speaker: "Júlia", avatar: "julia", text: "Não estou descontrolada! Só cansei desse papinho machista de vocês!" }
        ],
        dialog_julia_constructive: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Ah... bem, você tem razão. Desculpa, não quis te subestimar. Vamos fazer um teste de chute a gol agora mesmo!" },
          { type: "dialogue", speaker: "Júlia", avatar: "julia", text: "Perfeito! Preparem-se, porque eu não vim para brincadeira!" }
        ]
      }
    },
    {
      id: 2,
      title: "Capítulo 2: Lucas",
      subtitle: "A Pressão de Grupo",
      bgUrl: schoolBgUrl, // Corredor da Escola!
      bgKey: "schoolBg",
      char: "lucas",
      desc: "Lucas enfrenta o desafio de se posicionar diante de piadas e comentários machistas de seus amigos, que tentam impor uma masculinidade tóxica no corredor.",
      steps: [
        {
          type: "narrator",
          text: "No intervalo das aulas, Lucas está com seu grupo de amigos perto dos armários do corredor principal da escola."
        },
        {
          type: "dialogue",
          speaker: "Mateus",
          avatar: "mateus",
          text: "Ei, galera, olhem lá! Aquela aluna nova que acabou de passar... Que nota vocês dão para ela? Uma nota 5 ou 6? Que corpo, hein?"
        },
        {
          type: "dialogue",
          speaker: "Marcos",
          avatar: "marcos",
          text: "Ahaha, pra mim é nota 6! E aí, Lucas, vai ficar calado? Qual é a sua nota? Não vai dizer que ficou com medinho ou virou sensível demais!"
        },
        {
          type: "choice",
          prompt: "Como Lucas deve agir diante da cobrança dos amigos?",
          choices: [
            {
              option: "A",
              text: "Seguir o grupo para ser aceito: 'Ah, sei lá... Dou um 6 também. Ela é bonitinha. (Rir junto)'",
              stats: { respect: -15, empathy: -15, awareness: -20 },
              feedback: {
                title: "Objetificação e Cumplicidade",
                text: "Ao rir e atribuir notas, Lucas valida a cultura de objetificação das mulheres e o machismo estrutural. Isso reduz as meninas a meros objetos de avaliação física e reforça um ambiente escolar desrespeitoso.",
                nextStep: "dialog_lucas_conformed"
              }
            },
            {
              option: "B",
              text: "Ficar em silêncio e ignorar: 'Ah, prefiro não opinar... Vou ali comprar um lanche.' (E se afasta)",
              stats: { respect: 0, empathy: +5, awareness: -5 },
              feedback: {
                title: "Silêncio Omissivo",
                text: "Lucas não incentiva o comportamento, mas seu silêncio é interpretado pelo grupo como consentimento. A omissão de aliados permite que piadas e atitudes machistas continuem se reproduzindo sem barreiras.",
                nextStep: "dialog_lucas_silent"
              }
            },
            {
              option: "C",
              text: "Questionar a atitude do grupo: 'Pô, galera, que mancada fazer isso. Imagina se fizessem isso com as nossas amigas ou irmãs? Elas não são mercadoria para receber nota. Vamos mudar de assunto.'",
              stats: { respect: +15, empathy: +20, awareness: +25 },
              feedback: {
                title: "Aliado Ativo e Masculinidade Saudável",
                text: "Incrível! Chamar a atenção dos próprios amigos sobre atitudes machistas exige coragem, mas é fundamental. Lucas desconstrói a pressão de grupo e promove uma masculinidade baseada em empatia e respeito.",
                nextStep: "dialog_lucas_stoodup"
              }
            }
          ]
        }
      ],
      reactions: {
        dialog_lucas_conformed: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Aí sim, Lucas! Sabia que você era dos nossos!" },
          { type: "dialogue", speaker: "Lucas", avatar: "lucas", text: "(Pensando triste)... Por que fiz isso? Me senti muito mal de participar disso." }
        ],
        dialog_lucas_silent: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Ih, o Lucas ficou sem graça e correu de fininho! Que careta, cara." },
          { type: "dialogue", speaker: "Lucas", avatar: "lucas", text: "(Pensando)... Eu devia ter falado alguma coisa para defendê-la..." }
        ],
        dialog_lucas_stoodup: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Pô... foi mal. É só zoeira, né? Mas... parando para pensar, de fato é meio chato mesmo." },
          { type: "dialogue", speaker: "Lucas", avatar: "lucas", text: "Pois é, caras. Respeito vem primeiro sempre." }
        ]
      }
    },
    {
      id: 3,
      title: "Capítulo 3: Mariana",
      subtitle: "Voz Interrompida",
      bgUrl: classroomBgUrl, // Sala de Aula!
      bgKey: "classroomBg",
      char: "mariana",
      desc: "Mariana é líder de um projeto de História. Ela tenta organizar o trabalho ao redor das carteiras da sala de aula, mas é constantemente interrompida e subestimada.",
      steps: [
        {
          type: "narrator",
          text: "Na sala de aula, o grupo de História se reúne ao redor das carteiras para definir a apresentação escolar. Mariana pesquisou bastante e está liderando a divisão."
        },
        {
          type: "dialogue",
          speaker: "Mariana",
          avatar: "mariana",
          text: "Gente, montei esse roteiro. Começamos explicando as causas socioeconômicas, depois dividimos a análise das consequências..."
        },
        {
          type: "narrator",
          text: "Mateus a interrompe bruscamente na mesa, falando por cima de sua voz."
        },
        {
          type: "dialogue",
          speaker: "Mateus",
          avatar: "mateus",
          text: "Calma aí, Mari, você está se empolgando muito e complicando. Galera, o que ela quis dizer com essa complexidade toda é que o povo estava sem dinheiro e pronto. Deixa que eu explico a divisão prática..."
        },
        {
          type: "choice",
          prompt: "Como Mariana deve responder para lidar com a interrupção?",
          choices: [
            {
              option: "A",
              text: "Ceder a palavra e encolher-se: 'Ah... tudo bem. Explica você, então. Deixa pra lá.'",
              stats: { respect: -10, empathy: -5, awareness: -15 },
              feedback: {
                title: "Manterrupting e Mansplaining",
                text: "Essa interrupção constante é chamada de 'Manterrupting' (homens interrompendo mulheres desproporcionalmente), seguida de 'Mansplaining' (homem explicando o óbvio como se ela não entendesse). Ceder cala a voz e a liderança de Mariana.",
                nextStep: "dialog_mariana_ceded"
              }
            },
            {
              option: "B",
              text: "Exaltar-se na discussão: 'Dá para calar a boca, Mateus? Eu estava falando! Você é muito chato e sempre me corta!'",
              stats: { respect: +5, empathy: -5, awareness: +5 },
              feedback: {
                title: "O Estereótipo da 'Mulher Raivosa'",
                text: "A frustração de Mariana é legítima, mas reagir com gritos permite que Mateus se aproveite do estereótipo de 'mulher histérica' ou 'exaltada', desviando o foco do comportamento desrespeitoso dele para a reação dela.",
                nextStep: "dialog_mariana_angry"
              }
            },
            {
              option: "C",
              text: "Reafirmar sua voz com firmeza: 'Mateus, por favor, me deixe terminar de falar sem interrupções. Eu estudei bastante o tema e formulei este roteiro lógico. Após eu concluir, você poderá opinar.'",
              stats: { respect: +20, empathy: +15, awareness: +20 },
              feedback: {
                title: "Assertividade Feminina",
                text: "Brilhante! Mariana impõe limites claros com postura firme e segura, sem dar espaço para que minimizem seu conhecimento ou silenciem sua voz. Ela reivindica seu legítimo espaço de liderança intelectual.",
                nextStep: "dialog_mariana_constructive"
              }
            }
          ]
        }
      ],
      reactions: {
        dialog_mariana_ceded: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Então, galera, a ideia prática que eu montei é a seguinte..." },
          { type: "dialogue", speaker: "Mariana", avatar: "mariana", text: "(Pensando desanimada)... Sinto que meu trabalho e conhecimento de nada adiantaram." }
        ],
        dialog_mariana_angry: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Nossa, Mari! Não precisa de agressividade, que estresse! Só tentei ajudar, você é muito nervosa." },
          { type: "dialogue", speaker: "Mariana", avatar: "mariana", text: "Eu não estou nervosa! Você que não me respeita!" }
        ],
        dialog_mariana_constructive: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Ah... desculpe, Mari. Pode continuar falando, vou ouvir." },
          { type: "dialogue", speaker: "Mariana", avatar: "mariana", text: "Obrigada. Como eu explicava, a primeira parte contextualiza as revoluções..." }
        ]
      }
    },
    {
      id: 4,
      title: "Capítulo 4: Gabriela",
      subtitle: "Divisão de Tarefas",
      bgUrl: classroomBgUrl, // Sala de Aula!
      bgKey: "classroomBg",
      char: "julia", // Reutiliza sprite para manter o carregamento leve
      desc: "Na organização de um evento na sala de aula, Gabriela se depara com uma divisão desigual de tarefas baseada em estereótipos domésticos.",
      steps: [
        {
          type: "narrator",
          text: "Após o término da feira de ciências na sala de aula, o professor pede que todos ajudem na organização e limpeza do espaço."
        },
        {
          type: "dialogue",
          speaker: "Professor",
          avatar: "mateus",
          text: "Pessoal, vamos lá! Para agilizar: as meninas varrem a sala e limpam as mesas, enquanto os meninos carregam as caixas de som pesadas e levantam as carteiras."
        },
        {
          type: "dialogue",
          speaker: "Gabriela",
          avatar: "julia",
          text: "Ué... por que essa divisão? Todo mundo aqui usou o espaço igualmente."
        },
        {
          type: "choice",
          prompt: "Como Gabriela deve propor uma divisão mais justa?",
          choices: [
            {
              option: "A",
              text: "Ceder passivamente: 'Tudo bem, meninas. Vamos varrer logo para ir embora de uma vez.'",
              stats: { respect: -10, empathy: -5, awareness: -15 },
              feedback: {
                title: "Reforço de Papéis Domésticos",
                text: "Ao aceitar, Gabriela perpetua o viés inconsciente de que as tarefas domésticas e de limpeza são atribuições essencialmente femininas, enquanto os homens ficam apenas com o trabalho físico externo.",
                nextStep: "dialog_gabi_ceded"
              }
            },
            {
              option: "B",
              text: "Reagir com agressividade: 'Ah, sim! Porque nós nascemos com vassoura na mão e vocês com músculos, né? Não vou varrer nada! Isso é ridículo!'",
              stats: { respect: +5, empathy: -5, awareness: +5 },
              feedback: {
                title: "Confronto não Produtivo",
                text: "A indignação com a divisão sexista é justa, mas responder de forma agressiva gera deboche por parte dos meninos e faz o professor ignorar sua queixa legítima.",
                nextStep: "dialog_gabi_angry"
              }
            },
            {
              option: "C",
              text: "Propor uma divisão mista: 'Professor, todos nós sujamos a sala e todos nós podemos limpar. Que tal dividirmos em duplas mistas? Uma parte varre e a outra carrega as caixas, independente de gênero.'",
              stats: { respect: +20, empathy: +15, awareness: +20 },
              feedback: {
                title: "Cooperação e Igualdade Prática",
                text: "Brilhante! Gabriela propõe uma solução justa, colaborativa e lógica, quebrando estereótipos de força ou cuidado e ensinando que todos na escola compartilham as mesmas responsabilidades.",
                nextStep: "dialog_gabi_constructive"
              }
            }
          ]
        }
      ],
      reactions: {
        dialog_gabi_ceded: [
          { type: "dialogue", speaker: "Professor", avatar: "mateus", text: "Obrigado, meninas, vocês são muito caprichosas e organizadas." },
          { type: "dialogue", speaker: "Gabriela", avatar: "julia", text: "(Pensando)... Isso foi muito injusto. Ficamos com todo o trabalho de limpeza sozinhas." }
        ],
        dialog_gabi_angry: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Nossa, que estresse por causa de uma vassoura! Só queríamos poupar vocês do peso." },
          { type: "dialogue", speaker: "Gabriela", avatar: "julia", text: "Não queremos ser poupadas, queremos igualdade!" }
        ],
        dialog_gabi_constructive: [
          { type: "dialogue", speaker: "Professor", avatar: "mateus", text: "Você tem toda razão, Gabriela. Peço desculpas. Vamos dividir em duplas mistas agora mesmo." },
          { type: "dialogue", speaker: "Gabriela", avatar: "julia", text: "Excelente! Assim todos ajudamos e terminamos muito mais rápido." }
        ]
      }
    },
    {
      id: 5,
      title: "Capítulo 5: Rodrigo",
      subtitle: "Pressão Estética e Masculinidade",
      bgUrl: sportsBgUrl, // Quadra de Esportes!
      bgKey: "sportsBg",
      char: "lucas",
      desc: "Rodrigo prefere atividades artísticas em vez de futebol na Educação Física, e enfrenta piadas homofóbicas e machistas de colegas de classe na quadra.",
      steps: [
        {
          type: "narrator",
          text: "Durante a aula de Educação Física na quadra de esportes, Rodrigo optou por participar do ensaio de dança e teatro, enquanto a maioria dos rapazes joga futebol."
        },
        {
          type: "dialogue",
          speaker: "Marcos",
          avatar: "marcos",
          text: "E aí, Rodrigão? Vai ficar rebolando e dançando com as meninas? Homem de verdade joga bola! Entra aí no time se for homem!"
        },
        {
          type: "dialogue",
          speaker: "Mateus",
          avatar: "mateus",
          text: "Ahaha! Deixa ele, Marcos, ele não aguenta um jogo de verdade, é muito sensível."
        },
        {
          type: "choice",
          prompt: "Como Rodrigo deve reagir para desconstruir essa provocação machista?",
          choices: [
            {
              option: "A",
              text: "Forçar-se a jogar para ser aceito: 'Ah... tá bom. Eu jogo então, só para vocês pararem com essa palhaçada.'",
              stats: { respect: -10, empathy: -10, awareness: -15 },
              feedback: {
                title: "Conformismo à Masculinidade Tóxica",
                text: "Ao ceder, Rodrigo anula seus próprios gostos e se submete a uma pressão violenta apenas para provar que se encaixa em uma caixinha estreita do que os outros definem como 'ser homem'.",
                nextStep: "dialog_rod_ceded"
              }
            },
            {
              option: "B",
              text: "Ofender de volta: 'Calem a boca, seus ogros ignorantes! Vocês só pensam em chutar uma bola, bando de idiotas sem cérebro!'",
              stats: { respect: +5, empathy: -5, awareness: +5 },
              feedback: {
                title: "Agressividade e Escala de Tensão",
                text: "Embora Rodrigo esteja se defendendo de uma agressão, responder na mesma moeda de hostilidade apenas reforça a rivalidade e faz com que os garotos o ataquem ainda mais.",
                nextStep: "dialog_rod_angry"
              }
            },
            {
              option: "C",
              text: "Reafirmar sua identidade: 'Galera, dança e teatro exigem coordenação e preparo físico incríveis. E eu não preciso chutar uma bola para provar minha masculinidade. Cada um joga o que gosta.'",
              stats: { respect: +20, empathy: +20, awareness: +25 },
              feedback: {
                title: "Masculinidade Saudável e Plural",
                text: "Fantástico! Rodrigo se posiciona com imensa maturidade. Ele desconstrói a ideia de que a masculinidade está atrelada a esportes brutos e valida a sensibilidade e a arte como espaços masculinos legítimos.",
                nextStep: "dialog_rod_constructive"
              }
            }
          ]
        }
      ],
      reactions: {
        dialog_rod_ceded: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Viu só? Sabia que no fundo você queria jogar! Corre lá para a zaga!" },
          { type: "dialogue", speaker: "Rodrigo", avatar: "lucas", text: "(Pensando desanimado)... Detesto isso, me sinto péssimo fingindo ser quem não sou." }
        ],
        dialog_rod_angry: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Eita, bicho! O bailarino ficou bravo! Cuidado que ele vai morder, galera! Ahaha!" },
          { type: "dialogue", speaker: "Rodrigo", avatar: "lucas", text: "Não estou bravo, vocês que são uns infantis desrespeitosos!" }
        ],
        dialog_rod_constructive: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Pô... de fato, o ensaio de dança deles parece bem cansativo mesmo. Foi mal aí, Rodrigo, joga lá sua dança." },
          { type: "dialogue", speaker: "Rodrigo", avatar: "lucas", text: "Obrigado. Respeito mútuo faz bem para todo mundo." }
        ]
      }
    },
    {
      id: 6,
      title: "Capítulo 6: Letícia",
      subtitle: "Julgamento de Comportamento",
      bgUrl: schoolBgUrl, // Corredor da Escola!
      bgKey: "schoolBg",
      char: "mariana",
      desc: "No corredor da escola, Letícia sofre cobranças desiguais sobre a sua farda e comportamento, sendo responsabilizada pelas reações dos meninos.",
      steps: [
        {
          type: "narrator",
          text: "No corredor, Letícia dobrou levemente as mangas da camisa do seu uniforme do IF Baiano para se refrescar do calor."
        },
        {
          type: "dialogue",
          speaker: "Coordenador",
          avatar: "mateus",
          text: "Letícia, por favor, abaixe as mangas da camisa. Esse comportamento chama atenção desnecessária e acaba distraindo e provocando os rapazes na hora das aulas."
        },
        {
          type: "dialogue",
          speaker: "Letícia",
          avatar: "mariana",
          text: "Ué... mas está fazendo quase 30 graus hoje. E meu uniforme está cobrindo tudo direito."
        },
        {
          type: "choice",
          prompt: "Como Letícia deve dialogar com o coordenador?",
          choices: [
            {
              option: "A",
              text: "Sentir vergonha e ceder: 'Desculpa... vou abaixar as mangas e colocar um casaco para não incomodar mais.'",
              stats: { respect: -10, empathy: -5, awareness: -15 },
              feedback: {
                title: "Culpa e Submissão",
                text: "Ao se desculpar, Letícia aceita a premissa machista de que as mulheres são as responsáveis pelo comportamento e pela falta de autocontrole dos homens, aceitando a repressão do próprio corpo.",
                nextStep: "dialog_let_ceded"
              }
            },
            {
              option: "B",
              text: "Confrontar grosseiramente: 'A gola e a manga deles também estão curtas e ninguém fala nada! Vocês são muito hipócritas e machistas! Vão cuidar de outra coisa!'",
              stats: { respect: +5, empathy: -5, awareness: +5 },
              feedback: {
                title: "Ataque Ríspido",
                text: "Embora Letícia aponte uma clara hipocrisia de dois pesos e duas medidas, a forma ríspida faz com que o coordenador a puna por indisciplina, abafando o debate sobre gênero.",
                nextStep: "dialog_let_angry"
              }
            },
            {
              option: "C",
              text: "Questionar de forma lógica: 'Coordenador, as mangas dos meninos também estão dobradas pelo calor e isso não é problema. A atenção deles deve ser cobrada deles mesmos, não do tamanho do meu uniforme.'",
              stats: { respect: +20, empathy: +15, awareness: +25 },
              feedback: {
                title: "Combate aos Dois Pesos e Duas Medidas",
                text: "Excelente! Letícia aponta com lógica o duplo padrão de julgamento da escola e transfere a responsabilidade do foco e do respeito para os próprios meninos, que é onde realmente deve estar.",
                nextStep: "dialog_let_constructive"
              }
            }
          ]
        }
      ],
      reactions: {
        dialog_let_ceded: [
          { type: "dialogue", speaker: "Coordenador", avatar: "mateus", text: "Obrigado, Letícia. É melhor evitar problemas e focar nos estudos." },
          { type: "dialogue", speaker: "Letícia", avatar: "mariana", text: "(Pensando triste e suando)... Que injustiça. Os meninos andam super à vontade e eu preciso morrer de calor." }
        ],
        dialog_let_angry: [
          { type: "dialogue", speaker: "Coordenador", avatar: "mateus", text: "Olha o respeito, Letícia! Estou apenas cobrando a norma. Vá para a diretoria por desacato!" },
          { type: "dialogue", speaker: "Letícia", avatar: "mariana", text: "Isso é muito injusto e vocês sabem!" }
        ],
        dialog_let_constructive: [
          { type: "dialogue", speaker: "Coordenador", avatar: "mateus", text: "Hum... de fato, o calor está forte para todos e as regras devem valer igualmente. Peço desculpas, Letícia, pode manter as mangas dobradas." },
          { type: "dialogue", speaker: "Letícia", avatar: "mariana", text: "Muito obrigada, coordenador. O bom senso e a igualdade devem guiar a escola." }
        ]
      }
    },
    {
      id: 7,
      title: "Capítulo 7: Felipe",
      subtitle: "Boatos e Exposição Online",
      bgUrl: schoolBgUrl, // Corredor da Escola!
      bgKey: "schoolBg",
      char: "mateus",
      desc: "Felipe recebe em um grupo de WhatsApp uma foto íntima vazada de uma colega de sala, e enfrenta a decisão de repassar ou intervir.",
      steps: [
        {
          type: "narrator",
          text: "No final das aulas, Felipe recebe uma notificação no celular. É o grupo de WhatsApp apenas com os rapazes da sala de aula."
        },
        {
          type: "dialogue",
          speaker: "Marcos",
          avatar: "marcos",
          text: "E aí, galera! Olhem essa foto que vazou da Luana da outra sala! Que vacilo dela, hein? Mandem para todo mundo!"
        },
        {
          type: "dialogue",
          speaker: "Mateus",
          avatar: "mateus",
          text: "Caraca, compartilha logo no grupo de futsal também! Ela quis se expor, agora aguenta! Ahaha!"
        },
        {
          type: "choice",
          prompt: "Como Felipe deve agir diante do compartilhamento criminoso?",
          choices: [
            {
              option: "A",
              text: "Compartilhar para ganhar status: 'Nossa! Repassa mesmo! Vou mandar para o grupo do condomínio também. (Repassa a foto)'",
              stats: { respect: -25, empathy: -25, awareness: -30 },
              feedback: {
                title: "Exposição Criminosa e Violência Digital",
                text: "Compartilhar fotos íntimas sem consentimento é crime grave (Lei Rose Leonel / Dignidade Sexual). Além da gravidade jurídica, Felipe destrói a saúde mental da colega e incentiva um linchamento moral covarde.",
                nextStep: "dialog_fel_ceded"
              }
            },
            {
              option: "B",
              text: "Apenas ignorar: Não fala nada no grupo, deleta a foto do próprio celular e finge que não viu.",
              stats: { respect: 0, empathy: +5, awareness: -5 },
              feedback: {
                title: "Omissão Diante da Violência",
                text: "Felipe não comete o crime de espalhar, o que é melhor, mas seu silêncio permite que a violência continue ocorrendo livremente no grupo de amigos sem nenhuma oposição moral.",
                nextStep: "dialog_fel_silent"
              }
            },
            {
              option: "C",
              text: "Intervir de forma ativa: 'Galera, parem com isso! Isso é crime grave de exposição e machismo puro. Apaguem essa foto e não repassem para ninguém. Tenham o mínimo de respeito e empatia pela colega.'",
              stats: { respect: +25, empathy: +25, awareness: +30 },
              feedback: {
                title: "Intervenção e Proteção Ativa",
                text: "Excepcional! A melhor atitude possível. Homens aliados intervindo ativamente no grupo de WhatsApp de amigos é a ferramenta mais eficaz para frear a disseminação de assédio e crimes digitais contra mulheres.",
                nextStep: "dialog_fel_constructive"
              }
            }
          ]
        }
      ],
      reactions: {
        dialog_fel_ceded: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Isso aí, Felipe! Sabia que você curtia uma zoeira! Essa foto vai bombar!" },
          { type: "dialogue", speaker: "Felipe", avatar: "mateus", text: "(Pensando com peso na consciência)... Por que eu fiz isso? Luana vai ficar arrasada na escola." }
        ],
        dialog_fel_silent: [
          { type: "dialogue", speaker: "Mateus", avatar: "mateus", text: "Ué, o Felipe visualizou e nem comentou nada, deve estar dormindo." },
          { type: "dialogue", speaker: "Felipe", avatar: "mateus", text: "(Pensando)... Sinto que deveria ter defendido a Luana, o pessoal é muito cruel." }
        ],
        dialog_fel_constructive: [
          { type: "dialogue", speaker: "Marcos", avatar: "marcos", text: "Eita... foi mal, Felipe. Você tem razão, bicho. É pisada na bola mesmo. Vou apagar aqui para não dar ruim." },
          { type: "dialogue", speaker: "Felipe", avatar: "mateus", text: "Valeu, cara. Respeito na internet também é lei." }
        ]
      }
    }
  ];

  // Situações do Mural da Igualdade (Mini-jogo Chalkboard)
  let muralPhrases = [
    {
      id: 1,
      bad: "Menina jogando futebol? kkk vai cozinhar!",
      good: "O futebol e o esporte são livres para todos os gêneros!",
      erased: false,
      progress: 0
    },
    {
      id: 2,
      bad: "Chorão igual meninazinha. Homem não chora!",
      good: "Sentimentos não têm gênero. Chorar e expressar emoção é humano!",
      erased: false,
      progress: 0
    },
    {
      id: 3,
      bad: "Mulher é muito emocional para lidar com exatas e robôs.",
      good: "Mulheres lideram na ciência, engenharia e lógica com excelência!",
      erased: false,
      progress: 0
    },
    {
      id: 4,
      bad: "Feminismo é apenas mimimi e vitimismo.",
      good: "O feminismo luta por direitos iguais, respeito e dignidade para todos!",
      erased: false,
      progress: 0
    }
  ];

  // Variáveis de controle de fluxo
  let state = {
    chapterIndex: -1, // -1 = Intro/Preload, 0-6 = Capítulos, 7 = Mural, 8 = End
    stepIndex: 0,
    currentStep: null,
    isTypewriting: false,
    textInterval: null,
    activeLeftChar: null,
    activeRightChar: null,
    speakingChar: null,
    inReaction: false,
    reactionIndex: 0,
    reactionKey: null,
    erasingPhraseId: null,
    erasingInterval: null
  };

  // Inicializar interface e preloads
  const shell = document.createElement("div");
  shell.className = "game-container";
  shell.style.backgroundImage = `url('${schoolBgUrl}')`;
  mount.replaceChildren(shell);

  // Carregar os recordes locais e estatísticas acumuladas do Playabl
  sdk.gameState.load().then((saved) => {
    if (saved) {
      if (saved.bestScore) bestScore = saved.bestScore;
      if (saved.statsDatabase) statsDatabase = saved.statsDatabase;
    }
  });

  // Mostrar tela de carregamento/start inicial
  showIntroOverlay();

  // Função para desenhar avatar recortado do atlas para um Canvas
  function drawAvatar(canvas, charName) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const frame = ATLAS_FRAMES[charName];
    if (!frame || !images.characterAtlas) return;

    canvas.width = 320;
    canvas.height = 320;
    ctx.clearRect(0, 0, 320, 320);
    ctx.drawImage(
      images.characterAtlas,
      frame.x, frame.y, frame.w, frame.h,
      0, 0, 320, 320
    );
  }

  // Precarregar todas as imagens incluindo os novos cenários
  function preloadImages(onProgress, onSuccess, onError) {
    const urls = {
      schoolBg: schoolBgUrl,
      chalkboardBg: chalkboardBgUrl,
      classroomBg: classroomBgUrl,
      sportsBg: sportsBgUrl,
      characterAtlas: characterAtlasUrl
    };
    let loaded = 0;
    const total = Object.keys(urls).length;

    for (const [key, url] of Object.entries(urls)) {
      const img = new Image();
      img.onload = () => {
        images[key] = img;
        loaded++;
        onProgress(Math.round((loaded / total) * 100));
        if (loaded === total) onSuccess();
      };
      img.onerror = () => {
        onError(`Erro ao carregar recurso visual: ${key}`);
      };
      img.src = url;
    }
  }

  // Iniciar Áudio do Jogo
  async function initAudio() {
    try {
      if (ambientMusicUrl) {
        audioContext = await sdk.audio.getContext();
        await audioContext.unlock();

        bgMusic = new Audio();
        bgMusic.src = ambientMusicUrl;
        bgMusic.loop = true;
        bgMusic.volume = tweaks.get("soundVolume") ?? 0.5;
        bgMusic.crossOrigin = "anonymous";
        
        bgMusic.play().catch(() => {
          // O navegador bloqueia sem toque do usuário
        });
      }
    } catch (e) {
      console.warn("Erro ao iniciar o sistema de áudio: ", e);
    }
  }

  // Disparar uma vibração rápida de haptic se suportada
  function triggerHaptic(duration = 40) {
    if (sdk.device.haptics.isSupported()) {
      sdk.device.haptics.vibrate(duration).catch(() => {});
    }
  }

  // Tela Inicial (Intro Overlay)
  function showIntroOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "intro-overlay";

    overlay.innerHTML = `
      <div class="intro-header">
        <div class="intro-tagline">Conscientização Escolar no IF Baiano</div>
        <h1 class="intro-title">${tweaks.get("gameTitle") ?? "Escolhas: Respeito na Escola"}</h1>
      </div>

      <div class="intro-illustration">
        <div class="intro-circle-bg"></div>
        <div class="intro-characters-composite">
          <canvas id="intro-canvas" style="width:100%; height:100%; object-fit:contain;"></canvas>
        </div>
      </div>

      <div class="intro-card">
        <p class="intro-card-text">
          O machismo pode se manifestar de formas sutis no dia a dia. Vivencie o cotidiano escolar sob a perspectiva de 7 estudantes, faça escolhas reflexivas e transforme o ambiente no Mural da Igualdade!
        </p>
      </div>

      <div class="intro-btn-container">
        <button class="intro-start-btn" id="start-game-btn" disabled>Carregando...</button>
        <span class="loading-progress" id="load-progress-lbl">Preparando escola (0%)...</span>
      </div>
    `;

    shell.appendChild(overlay);

    preloadImages(
      (pct) => {
        const lbl = document.getElementById("load-progress-lbl");
        if (lbl) lbl.textContent = `Preparando fardas do IF Baiano e cenários (${pct}%)...`;
      },
      () => {
        const btn = document.getElementById("start-game-btn");
        const lbl = document.getElementById("load-progress-lbl");
        if (btn) {
          btn.removeAttribute("disabled");
          btn.textContent = "Entrar no IF Baiano";
        }
        if (lbl) {
          lbl.textContent = "Tudo pronto com fardas oficiais e cenários!";
        }

        const canvas = document.getElementById("intro-canvas");
        if (canvas && images.characterAtlas) {
          const ctx = canvas.getContext("2d");
          canvas.width = 320;
          canvas.height = 320;
          
          const jFrame = ATLAS_FRAMES.julia;
          ctx.drawImage(images.characterAtlas, jFrame.x, jFrame.y, jFrame.w, jFrame.h, -10, 20, 220, 220);
          
          const lFrame = ATLAS_FRAMES.lucas;
          ctx.drawImage(images.characterAtlas, lFrame.x, lFrame.y, lFrame.w, lFrame.h, 110, 20, 220, 220);
        }
      },
      (err) => {
        const lbl = document.getElementById("load-progress-lbl");
        if (lbl) lbl.textContent = err;
      }
    );

    const startBtn = overlay.querySelector("#start-game-btn");
    startBtn.addEventListener("click", async () => {
      triggerHaptic(60);
      await initAudio();
      overlay.style.transition = "opacity 0.5s ease";
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.remove();
        startChapter(0);
      }, 500);
    });
  }

  // Renderizar o Header de status
  function renderHeader() {
    let header = shell.querySelector(".game-header");
    if (!header) {
      header = document.createElement("header");
      header.className = "game-header";
      shell.prepend(header);
    }

    header.innerHTML = `
      <div class="stat-badge">
        <div class="stat-label-container">
          <span class="stat-icon">✊</span>
          <span class="stat-label">Respeito</span>
        </div>
        <div class="stat-bar-outer">
          <div class="stat-bar-inner stat-bar-respect" style="width: ${respect}%"></div>
        </div>
        <span class="stat-value">${respect}%</span>
      </div>

      <div class="stat-badge">
        <div class="stat-label-container">
          <span class="stat-icon">💙</span>
          <span class="stat-label">Empatia</span>
        </div>
        <div class="stat-bar-outer">
          <div class="stat-bar-inner stat-bar-empathy" style="width: ${empathy}%"></div>
        </div>
        <span class="stat-value">${empathy}%</span>
      </div>

      <div class="stat-badge">
        <div class="stat-label-container">
          <span class="stat-icon">💡</span>
          <span class="stat-label">Consciência</span>
        </div>
        <div class="stat-bar-outer">
          <div class="stat-bar-inner stat-bar-awareness" style="width: ${awareness}%"></div>
        </div>
        <span class="stat-value">${awareness}%</span>
      </div>
    `;
  }

  // Atualizar suavemente as barras de status
  function updateStats(diff) {
    if (diff.respect) respect = Math.max(10, Math.min(100, respect + diff.respect));
    if (diff.empathy) empathy = Math.max(10, Math.min(100, empathy + diff.empathy));
    if (diff.awareness) awareness = Math.max(10, Math.min(100, awareness + diff.awareness));

    renderHeader();
  }

  // Iniciar um capítulo (mostra Splash do capítulo antes e atualiza background!)
  function startChapter(idx) {
    state.chapterIndex = idx;
    state.stepIndex = 0;
    state.inReaction = false;
    state.reactionIndex = 0;
    state.reactionKey = null;

    if (idx >= chapters.length) {
      startMuralMiniGame();
      return;
    }

    const chap = chapters[idx];

    // Alterar o background da escola de acordo com a cena atual!
    const bgImgElement = images[chap.bgKey] || images.schoolBg;
    if (bgImgElement) {
      shell.style.backgroundImage = `url('${bgImgElement.src}')`;
    }

    // Criar Splash screen de introdução do capítulo
    const splash = document.createElement("div");
    splash.className = "chapter-splash";

    splash.innerHTML = `
      <div class="chapter-spl-num">Fase ${chap.id} de 7</div>
      <h2 class="chapter-spl-title">${chap.title}</h2>
      <div class="chapter-spl-char">
        <canvas id="splash-char-canvas" style="width:100%; height:100%;"></canvas>
      </div>
      <p class="chapter-spl-desc">${chap.desc}</p>
      <button class="feedback-btn" id="start-chap-btn">VIVENCIAR SITUAÇÃO</button>
    `;

    shell.appendChild(splash);
    renderHeader();

    const canvas = splash.querySelector("#splash-char-canvas");
    drawAvatar(canvas, chap.char);

    splash.querySelector("#start-chap-btn").addEventListener("click", () => {
      triggerHaptic(50);
      splash.style.transition = "opacity 0.4s ease";
      splash.style.opacity = 0;
      setTimeout(() => {
        splash.remove();
        setupDialogueScreen();
        processDialogueStep();
      }, 400);
    });
  }

  // Configurar container e camadas de diálogo
  function setupDialogueScreen() {
    let dialogueArea = shell.querySelector(".dialogue-area");
    if (!dialogueArea) {
      dialogueArea = document.createElement("div");
      dialogueArea.className = "dialogue-area";
      shell.appendChild(dialogueArea);
    }

    dialogueArea.innerHTML = `
      <div class="character-stage">
        <div class="character-container" id="char-left">
          <canvas class="character-canvas" id="canvas-left"></canvas>
        </div>
        <div class="character-container" id="char-right">
          <canvas class="character-canvas" id="canvas-right"></canvas>
        </div>
      </div>

      <div class="dialogue-box-container">
        <div class="dialogue-box" id="dialogue-box">
          <span class="speaker-name-tag" id="speaker-name">Narrador</span>
          <p class="dialogue-text" id="dialogue-text"></p>
          <div class="choices-container" id="choices-container" hidden></div>
          <span class="dialogue-click-indicator" id="click-indicator">Toque para continuar...</span>
        </div>
      </div>
    `;

    const container = dialogueArea.querySelector(".dialogue-box-container");
    container.addEventListener("click", (e) => {
      if (e.target.closest(".choice-btn") || e.target.closest(".feedback-btn")) return;
      
      if (state.isTypewriting) {
        skipTypewriting();
      } else {
        const chap = chapters[state.chapterIndex];
        const step = state.inReaction 
          ? chap.reactions[state.reactionKey][state.reactionIndex]
          : chap.steps[state.stepIndex];

        if (step && step.type !== "choice") {
          advanceDialogue();
        }
      }
    });
  }

  // Avançar diálogo
  function advanceDialogue() {
    triggerHaptic(20);
    const chap = chapters[state.chapterIndex];

    if (state.inReaction) {
      state.reactionIndex++;
      const reactionList = chap.reactions[state.reactionKey];
      if (state.reactionIndex < reactionList.length) {
        processDialogueStep();
      } else {
        state.inReaction = false;
        setTimeout(() => {
          startChapter(state.chapterIndex + 1);
        }, 300);
      }
    } else {
      state.stepIndex++;
      if (state.stepIndex < chap.steps.length) {
        processDialogueStep();
      }
    }
  }

  // Processar o passo atual do diálogo (atualiza atores, textos, etc.)
  function processDialogueStep() {
    const chap = chapters[state.chapterIndex];
    const step = state.inReaction 
      ? chap.reactions[state.reactionKey][state.reactionIndex]
      : chap.steps[state.stepIndex];

    if (!step) return;

    const txtEl = document.getElementById("dialogue-text");
    const nameEl = document.getElementById("speaker-name");
    const clickInd = document.getElementById("click-indicator");
    const choicesCont = document.getElementById("choices-container");

    clickInd.hidden = true;
    choicesCont.hidden = true;
    choicesCont.innerHTML = "";

    if (step.type === "narrator") {
      nameEl.textContent = "Narrador";
      nameEl.style.background = "linear-gradient(135deg, #455a64, #607d8b)";
      deactivateCharacters();
      typewriteText(step.text, txtEl, () => {
        clickInd.hidden = false;
      });
    } else if (step.type === "dialogue") {
      nameEl.textContent = step.speaker;
      nameEl.style.background = "linear-gradient(135deg, #6200ea, #7c4dff)";
      updateCharacterStage(step.avatar, step.speaker);
      typewriteText(step.text, txtEl, () => {
        clickInd.hidden = false;
      });
    } else if (step.type === "choice") {
      nameEl.textContent = "Escolha Reflexiva";
      nameEl.style.background = "linear-gradient(135deg, #ff4081, #f50057)";
      deactivateCharacters();
      txtEl.textContent = step.prompt;
      
      choicesCont.hidden = false;
      step.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.textContent = choice.text;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          selectChoice(choice);
        });
        choicesCont.appendChild(btn);
      });
    }
  }

  // Desativar brilho dos personagens
  function deactivateCharacters() {
    const leftCont = document.getElementById("char-left");
    const rightCont = document.getElementById("char-right");
    if (leftCont) leftCont.className = "character-container inactive";
    if (rightCont) rightCont.className = "character-container inactive";
  }

  // Gerenciar quem está visível e brilhando no palco
  function updateCharacterStage(avatar, speaker) {
    const leftCont = document.getElementById("char-left");
    const rightCont = document.getElementById("char-right");
    const canvasLeft = document.getElementById("canvas-left");
    const canvasRight = document.getElementById("canvas-right");

    const chap = chapters[state.chapterIndex];
    const heroChar = chap.char;

    if (!leftCont || !rightCont) return;

    if (state.activeLeftChar !== heroChar) {
      state.activeLeftChar = heroChar;
      leftCont.className = "character-container active";
      drawAvatar(canvasLeft, heroChar);
    }

    if (avatar && avatar !== heroChar) {
      if (state.activeRightChar !== avatar) {
        state.activeRightChar = avatar;
        rightCont.className = "character-container active";
        drawAvatar(canvasRight, avatar);
      }
    }

    if (avatar === heroChar) {
      leftCont.className = "character-container speaking";
      rightCont.className = "character-container inactive";
    } else if (avatar && avatar !== heroChar) {
      leftCont.className = "character-container inactive";
      rightCont.className = "character-container speaking";
    } else {
      if (speaker === "Júlia" || speaker === "Lucas" || speaker === "Mariana" || speaker === "Gabriela" || speaker === "Rodrigo" || speaker === "Letícia" || speaker === "Felipe") {
        leftCont.className = "character-container speaking";
        rightCont.className = "character-container inactive";
      } else {
        leftCont.className = "character-container inactive";
        rightCont.className = "character-container inactive";
      }
    }
  }

  // Efeito de máquina de escrever
  let fullTextToType = "";
  let typewriteTarget = null;
  let typewriteCallback = null;

  function typewriteText(text, element, callback) {
    clearInterval(state.textInterval);
    state.isTypewriting = true;
    fullTextToType = text;
    typewriteTarget = element;
    typewriteCallback = callback;
    
    element.textContent = "";
    let i = 0;
    
    state.textInterval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(state.textInterval);
        state.isTypewriting = false;
        if (callback) callback();
      }
    }, 15);
  }

  function skipTypewriting() {
    clearInterval(state.textInterval);
    state.isTypewriting = false;
    if (typewriteTarget) {
      typewriteTarget.textContent = fullTextToType;
    }
    if (typewriteCallback) {
      typewriteCallback();
    }
  }

  // Lidar com a seleção de uma escolha
  function selectChoice(choice) {
    triggerHaptic(70);

    // Contabilizar Acertos e Erros (Opção C é sempre o diálogo construtivo e assertivo!)
    if (choice.option === "C") {
      correctAnswers++;
    } else {
      incorrectAnswers++;
    }

    // Registrar estatística no banco de dados local
    const chapKey = `chap${state.chapterIndex + 1}`;
    if (statsDatabase[chapKey] && statsDatabase[chapKey][choice.option] !== undefined) {
      statsDatabase[chapKey][choice.option]++;
    }

    updateStats(choice.stats);
    showPedagogicalFeedback(choice);
  }

  // Mostrar balão pedagógico explicando a situação
  function showPedagogicalFeedback(choice) {
    const feedbackOverlay = document.createElement("div");
    feedbackOverlay.className = "feedback-overlay visible";

    let statsHtml = "";
    for (const [stat, val] of Object.entries(choice.stats)) {
      if (val === 0) continue;
      const isPlus = val > 0;
      const label = stat === "respect" ? "Respeito" : stat === "empathy" ? "Empatia" : "Consciência";
      const icon = stat === "respect" ? "✊" : stat === "empathy" ? "💙" : "💡";
      statsHtml += `
        <span class="feedback-stat-item ${isPlus ? 'plus' : 'minus'}">
          ${icon} ${label} ${isPlus ? '+' : ''}${val}%
        </span>
      `;
    }

    const isCorrect = choice.option === "C";

    feedbackOverlay.innerHTML = `
      <div class="feedback-card" style="border-color: ${isCorrect ? '#38ef7d' : '#ff4081'}">
        <h3 class="feedback-title" style="color: ${isCorrect ? '#38ef7d' : '#ff4081'}">
          ${isCorrect ? "✅ Resposta Correta!" : "❌ Resposta Incorreta!"}
        </h3>
        <h4 style="font-family:'Fredoka', sans-serif; font-size:1.05rem; margin: 4px 0 10px 0; color:#e0d9ff;">
          ${choice.feedback.title}
        </h4>
        <p class="feedback-text">${choice.feedback.text}</p>
        <div class="feedback-stat-changes">
          ${statsHtml}
        </div>
        <button class="feedback-btn" id="close-feedback-btn">COMPREENDI</button>
      </div>
    `;

    shell.appendChild(feedbackOverlay);

    feedbackOverlay.querySelector("#close-feedback-btn").addEventListener("click", () => {
      triggerHaptic(40);
      feedbackOverlay.style.transition = "opacity 0.3s ease";
      feedbackOverlay.style.opacity = 0;
      setTimeout(() => {
        feedbackOverlay.remove();
        
        state.inReaction = true;
        state.reactionIndex = 0;
        state.reactionKey = choice.feedback.nextStep;
        
        processDialogueStep();
      }, 300);
    });
  }

  // MINI-JOGO: MURAL DA IGUALDADE (CHALKBOARD)
  function startMuralMiniGame() {
    state.chapterIndex = 7;
    
    // Retornar ao background do corredor para emoldurar a lousa
    if (images.schoolBg) {
      shell.style.backgroundImage = `url('${images.schoolBg.src}')`;
    }

    const dialogueArea = shell.querySelector(".dialogue-area");
    if (dialogueArea) dialogueArea.remove();

    const muralCont = document.createElement("div");
    muralCont.className = "mural-container";

    muralCont.innerHTML = `
      <div class="mural-header">
        <h2 class="mural-title">O Mural da Igualdade</h2>
        <p class="mural-subtitle">Frases machistas foram pichadas na lousa do IF Baiano. Toque repetidamente para apagar o preconceito e ressignificar com respeito!</p>
      </div>

      <div class="chalkboard-box" style="background-image: url('${chalkboardBgUrl}')">
        <div class="chalkboard-surface" id="mural-surface"></div>
      </div>

      <div class="intro-btn-container" style="display:none;" id="mural-finish-cont">
        <button class="intro-start-btn" id="finish-mural-btn">VER RESULTADO GERAL</button>
      </div>
    `;

    shell.appendChild(muralCont);
    renderHeader();
    renderPhrases();
  }

  function renderPhrases() {
    const surface = document.getElementById("mural-surface");
    if (!surface) return;

    surface.innerHTML = "";

    muralPhrases.forEach((p) => {
      const item = document.createElement("div");
      item.className = `mural-item ${p.erased ? 'erased' : ''}`;
      item.setAttribute("data-id", p.id);

      item.innerHTML = `
        ${p.erased ? '<span class="erased-badge">RESSIGNIFICADO</span>' : '<span class="erase-badge">CLIQUE PARA APAGAR</span>'}
        <p class="phrase-bad">${p.bad}</p>
        <p class="phrase-good">${p.good}</p>
        <div class="erase-progress-bar-container">
          <div class="erase-progress-bar" id="pb-${p.id}" style="width: ${p.progress}%"></div>
        </div>
      `;

      if (!p.erased) {
        item.addEventListener("mousedown", () => startErasing(p.id));
        item.addEventListener("touchstart", (e) => {
          e.preventDefault();
          startErasing(p.id);
        });
        
        item.addEventListener("mouseup", stopErasing);
        item.addEventListener("mouseleave", stopErasing);
        item.addEventListener("touchend", stopErasing);
      }

      surface.appendChild(item);
    });
  }

  function startErasing(id) {
    if (state.erasingPhraseId) return;
    
    state.erasingPhraseId = id;
    const p = muralPhrases.find(item => item.id === id);
    if (!p || p.erased) return;

    const element = document.querySelector(`.mural-item[data-id="${id}"]`);
    if (element) {
      element.classList.add("erasing");
    }

    state.erasingInterval = setInterval(() => {
      p.progress += 8;
      triggerHaptic(15);
      
      const bar = document.getElementById(`pb-${id}`);
      if (bar) bar.style.width = `${p.progress}%`;

      if (p.progress >= 100) {
        clearInterval(state.erasingInterval);
        p.erased = true;
        p.progress = 100;
        state.erasingPhraseId = null;
        
        triggerHaptic(80);
        updateStats({ respect: 10, empathy: 10, awareness: 15 });
        
        renderPhrases();
        checkMuralCompletion();
      }
    }, 60);
  }

  function stopErasing() {
    if (state.erasingPhraseId) {
      const element = document.querySelector(`.mural-item[data-id="${state.erasingPhraseId}"]`);
      if (element) {
        element.classList.remove("erasing");
      }
      clearInterval(state.erasingInterval);
      state.erasingPhraseId = null;
    }
  }

  function checkMuralCompletion() {
    const allClean = muralPhrases.every(p => p.erased);
    if (allClean) {
      triggerHaptic(120);
      const finishCont = document.getElementById("mural-finish-cont");
      if (finishCont) {
        finishCont.style.display = "flex";
        finishCont.scrollIntoView({ behavior: "smooth" });
      }
      
      document.getElementById("finish-mural-btn").addEventListener("click", () => {
        triggerHaptic(60);
        showEndDashboard();
      });
    }
  }

  // TELA DE RESULTADOS FINAIS
  async function showEndDashboard() {
    state.chapterIndex = 8; // Fim total

    const mural = shell.querySelector(".mural-container");
    if (mural) mural.remove();

    // Calcular pontuação final
    const finalScore = (respect + empathy + awareness) * 10;
    
    // Salvar recorde e estatísticas acumuladas no gameState do Playabl
    if (finalScore > bestScore) {
      bestScore = finalScore;
    }
    await sdk.gameState.save({ bestScore, statsDatabase });

    // Avaliação pedagógica baseada no desempenho das 7 situações
    let evalTitle = "";
    let evalText = "";
    if (correctAnswers === 7) {
      evalTitle = "Grande Embaixador do Respeito no IF Baiano!";
      evalText = "Incrível! Você tomou a decisão correta e assertiva em todas as 7 situações práticas da escola. Você demonstrou profunda empatia e conhecimento exemplar sobre igualdade de gênero, ajudando a combater ativamente o machismo.";
    } else if (correctAnswers >= 4) {
      evalTitle = "Agente de Mudança do Campus!";
      evalText = "Parabéns! Você acertou a maioria das situações práticas e promoveu o diálogo construtivo. Pequenos ajustes de posicionamento em situações desafiadoras te transformarão em um líder completo de igualdade!";
    } else {
      evalTitle = "Refletindo e Aprendendo";
      evalText = "Bom esforço! Muitas microagressões de gênero ocorrem de forma invisível. Que tal jogar novamente para descobrir como escolhas mais assertivas e baseadas no diálogo e respeito podem transformar a escola?";
    }

    // Calcular porcentagens das estatísticas gerais para as 7 perguntas
    function getPercent(val, total) {
      return total > 0 ? Math.round((val / total) * 100) : 0;
    }

    // Calcular dados em porcentagem de todas as fases
    const percs = {};
    for (let i = 1; i <= 7; i++) {
      const db = statsDatabase[`chap${i}`];
      const tot = db.A + db.B + db.C;
      percs[`p${i}A`] = getPercent(db.A, tot);
      percs[`p${i}B`] = getPercent(db.B, tot);
      percs[`p${i}C`] = getPercent(db.C, tot);
    }

    const dash = document.createElement("div");
    dash.className = "end-dashboard";

    dash.innerHTML = `
      <div style="text-align:center;">
        <h2 class="end-title">Fim da Jornada Escolar</h2>
      </div>

      <div class="end-score-box">
        <h3 class="end-score-title">Sua Pontuação Geral</h3>
        <div class="end-score-val" id="score-counter">0</div>
        
        <!-- Bloco de Acertos e Erros das 7 perguntas -->
        <div class="correct-stats-box">
          <div class="stat-badge-small correct">
            <span>✅ Acertos:</span>
            <strong>${correctAnswers} de 7</strong>
          </div>
          <div class="stat-badge-small incorrect">
            <span>❌ Erros:</span>
            <strong>${incorrectAnswers} de 7</strong>
          </div>
        </div>

        <div class="end-stats-breakdown">
          <div class="end-stat-col">
            <span class="end-stat-lbl">Respeito</span>
            <span class="end-stat-val respect">${respect}%</span>
          </div>
          <div class="end-stat-col">
            <span class="end-stat-lbl">Empatia</span>
            <span class="end-stat-val empathy">${empathy}%</span>
          </div>
          <div class="end-stat-col">
            <span class="end-stat-lbl">Consciência</span>
            <span class="end-stat-val awareness">${awareness}%</span>
          </div>
        </div>

        <div style="margin-top:10px; font-size:0.75rem; color:#aaa;">
          Recorde Pessoal: ${bestScore} pontos
        </div>
      </div>

      <!-- Caixa de Avaliação Escolar -->
      <div class="evaluation-box">
        <h4 class="evaluation-title">🏆 ${evalTitle}</h4>
        <p class="evaluation-text">${evalText}</p>
      </div>

      <!-- SEÇÃO GRÁFICA DE OPINIÃO COMUNITÁRIA (Soma de todos os jogadores) -->
      <div class="chart-section">
        <h3 class="chart-section-title">📊 Estatísticas da Comunidade</h3>
        
        <!-- Capítulo 1 -->
        <div class="chart-card">
          <h4 class="chart-question">1. Inscrição no Futebol (Júlia):</h4>
          <div class="chart-bars">
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção A (Ceder)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-a" id="bar-1-A" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p1A}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção B (Raiva)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-b" id="bar-1-B" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p1B}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção C (Firmeza)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-c" id="bar-1-C" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p1C}%</span>
            </div>
          </div>
        </div>

        <!-- Capítulo 2 -->
        <div class="chart-card">
          <h4 class="chart-question">2. Julgamento no Corredor (Lucas):</h4>
          <div class="chart-bars">
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção A (Ceder)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-a" id="bar-2-A" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p2A}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção B (Silenciar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-b" id="bar-2-B" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p2B}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção C (Questionar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-c" id="bar-2-C" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p2C}%</span>
            </div>
          </div>
        </div>

        <!-- Capítulo 3 -->
        <div class="chart-card">
          <h4 class="chart-question">3. Interrupção na Aula (Mariana):</h4>
          <div class="chart-bars">
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção A (Ceder)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-a" id="bar-3-A" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p3A}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção B (Exaltar-se)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-b" id="bar-3-B" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p3B}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção C (Assertiva)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-c" id="bar-3-C" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p3C}%</span>
            </div>
          </div>
        </div>

        <!-- Capítulo 4 -->
        <div class="chart-card">
          <h4 class="chart-question">4. Limpeza da Sala (Gabriela):</h4>
          <div class="chart-bars">
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção A (Ceder)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-a" id="bar-4-A" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p4A}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção B (Gritar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-b" id="bar-4-B" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p4B}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção C (Mista)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-c" id="bar-4-C" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p4C}%</span>
            </div>
          </div>
        </div>

        <!-- Capítulo 5 -->
        <div class="chart-card">
          <h4 class="chart-question">5. Provocação na Quadra (Rodrigo):</h4>
          <div class="chart-bars">
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção A (Jogar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-a" id="bar-5-A" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p5A}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção B (Ofender)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-b" id="bar-5-B" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p5B}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção C (Posicionar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-c" id="bar-5-C" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p5C}%</span>
            </div>
          </div>
        </div>

        <!-- Capítulo 6 -->
        <div class="chart-card">
          <h4 class="chart-question">6. Julgamento da Farda (Letícia):</h4>
          <div class="chart-bars">
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção A (Sentir Culpa)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-a" id="bar-6-A" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p6A}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção B (Reagir)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-b" id="bar-6-B" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p6B}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção C (Questionar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-c" id="bar-6-C" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p6C}%</span>
            </div>
          </div>
        </div>

        <!-- Capítulo 7 -->
        <div class="chart-card">
          <h4 class="chart-question">7. Foto no Grupo (Felipe):</h4>
          <div class="chart-bars">
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção A (Repassar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-a" id="bar-7-A" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p7A}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção B (Ignorar)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-b" id="bar-7-B" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p7B}%</span>
            </div>
            <div class="chart-bar-row">
              <span class="chart-bar-lbl">Opção C (Intervir)</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill opt-c" id="bar-7-C" style="width: 0%"></div>
              </div>
              <span class="chart-bar-pct">${percs.p7C}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="end-actions">
        <button class="end-btn-submit" id="submit-leaderboard-btn">Enviar para o Ranking</button>
        <button class="end-btn-restart" id="restart-game-btn">Jogar Novamente</button>
      </div>
    `;

    shell.appendChild(dash);

    // Efeito de preenchimento animado de todos os 7 gráficos
    setTimeout(() => {
      for (let i = 1; i <= 7; i++) {
        document.getElementById(`bar-${i}-A`).style.width = `${percs[`p${i}A`]}%`;
        document.getElementById(`bar-${i}-B`).style.width = `${percs[`p${i}B`]}%`;
        document.getElementById(`bar-${i}-C`).style.width = `${percs[`p${i}C`]}%`;
      }
    }, 200);

    // Efeito de contagem do score
    let currentScoreCount = 0;
    const scoreCounter = document.getElementById("score-counter");
    const interval = setInterval(() => {
      currentScoreCount += Math.ceil(finalScore / 30);
      if (currentScoreCount >= finalScore) {
        currentScoreCount = finalScore;
        clearInterval(interval);
      }
      if (scoreCounter) scoreCounter.textContent = currentScoreCount;
    }, 25);

    // Enviar pontuação para o leaderboard
    const submitBtn = dash.querySelector("#submit-leaderboard-btn");
    submitBtn.addEventListener("click", async () => {
      triggerHaptic(50);
      submitBtn.textContent = "Enviando...";
      submitBtn.setAttribute("disabled", "true");
      
      try {
        const result = await sdk.leaderboard.submit(finalScore);
        if (result && result.accepted) {
          submitBtn.textContent = "Pontuação Enviada!";
          submitBtn.style.background = "#2e7d32";
        } else {
          submitBtn.textContent = "Pontuação Registrada!";
        }
      } catch (error) {
        console.error("Erro ao enviar pontuação:", error);
        submitBtn.textContent = "Erro ao enviar";
        submitBtn.removeAttribute("disabled");
      }
    });

    dash.querySelector("#restart-game-btn").addEventListener("click", () => {
      triggerHaptic(70);
      restartGame();
    });
  }

  // Reiniciar jogo
  function restartGame() {
    respect = tweaks.get("initialRespect") ?? 50;
    empathy = tweaks.get("initialEmpathy") ?? 50;
    awareness = tweaks.get("initialAwareness") ?? 40;
    correctAnswers = 0;
    incorrectAnswers = 0;

    muralPhrases.forEach(p => {
      p.erased = false;
      p.progress = 0;
    });

    state = {
      chapterIndex: -1,
      stepIndex: 0,
      currentStep: null,
      isTypewriting: false,
      textInterval: null,
      activeLeftChar: null,
      activeRightChar: null,
      speakingChar: null,
      inReaction: false,
      reactionIndex: 0,
      reactionKey: null,
      erasingPhraseId: null,
      erasingInterval: null
    };

    shell.innerHTML = "";
    showIntroOverlay();
  }

  // Retornar ciclo natural de limpeza
  cleanup = () => {
    clearInterval(state.textInterval);
    clearInterval(state.erasingInterval);
    if (bgMusic) {
      bgMusic.pause();
      bgMusic = null;
    }
    shell.innerHTML = "";
  };

  return {
    start() {
      // Iniciado automaticamente
    },
    destroy() {
      cleanup();
      cleanup = () => {};
    },
    sdk,
    ready,
    tweaks,
    assets
  };
}
