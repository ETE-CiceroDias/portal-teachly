// data/courses.js — Conteúdo completo dos 5 planos de ensino

export const COURSES = {
  dcu: {
    key: 'dcu',
    label: 'DCU',
    code: 'DE_232',
    fullname: 'Design Centrado no Usuário',
    info: 'Módulo 1 · Desenvolvimento de Sistemas [Subsequente]\n40h · 20 encontros de 1h20 · Março a Julho · 3 Blocos\nAvaliação integrada ao PI — mínimo 3 heurísticas no protótipo final',
    avaliacao: `Estrutura Avaliativa — 10 Pontos

• Relatório de Análise de Marca (2pts) — individual
• Seminário de Auditoria Heurística (5pts) — grupos
• Documento de Integração DCU + PI (3pts) — grupos

Critérios de auditoria para o Seminário (mínimo 5 das 10 heurísticas):
H1 — Visibilidade do status do sistema
H2 — Correspondência com o mundo real
H3 — Controle e liberdade do usuário
H4 — Consistência e padrões
H5 — Prevenção de erros
H6 — Reconhecimento em vez de recordação
H7 — Flexibilidade e eficiência de uso
H8 — Design estético e minimalista
H9 — Ajudar os usuários a reconhecer, diagnosticar e corrigir erros
H10 — Ajuda e documentação`,

    apresentacao: `Esta disciplina introduz o aluno ao Design Centrado no Usuário (DCU) como filosofia e conjunto de técnicas para criar sistemas que funcionam para as pessoas. A premissa central é simples: não adianta o código mais perfeito se o usuário não consegue encontrar o botão de 'salvar'. O objetivo não é aprender a desenhar telas — isso é trabalhado em Design Thinking —, mas aprender a avaliar, questionar e justificar decisões de design com base em princípios técnicos de usabilidade e interação.

O semestre está organizado em 3 blocos progressivos: o primeiro educa o olhar (vocabulário visual e conceitual), o segundo entra nas regras técnicas de usabilidade (heurísticas de Nielsen), e o terceiro fecha o ciclo aplicando tudo isso no próprio protótipo do Projeto Integrador.

Integração com Design Thinking (DE_233): as disciplinas são complementares e compartilham o mesmo projeto. Em DT os alunos aprendem a criar com empatia — persona, prototipação, Figma. Em DCU aprendem a avaliar e refinar com critérios técnicos de usabilidade.`,

    competencias: `Competências oficiais (DE_232 — Pernambuco):
• Reconhecer processos metodológicos e ciclos de design
• Reconhecer os processos de interação Humano-Computador
• Reconhecer elementos de interação social e emocional
• Compreender conceitos de usabilidade

O que o aluno saberá fazer ao final:
• Explicar o que é DCU, o ciclo ISO 9241-210 e como ele se diferencia do Design Thinking
• Diferenciar DCU (filosofia), UX (resultado) e UI (artefato) com clareza e exemplos reais
• Identificar princípios de affordance, feedback e modelo mental em interfaces cotidianas
• Aplicar as 10 heurísticas de Nielsen para auditar qualquer interface
• Usar gramática visual, tipografia e cor como instrumentos de usabilidade
• Documentar decisões de design com vocabulário técnico de DCU e IHC`,

    seminarioTemas: [
      'Cases de Design Thinking',
      'Empatia como ferramenta de profundidade no usuário',
      'Prototipagem rápida — ferramentas e técnicas',
      'Design Inclusivo e Diversidade',
      'Falhar rápido — a cultura do erro',
      'Design Thinking no Setor Público',
      'Design Thinking para o Cotidiano',
    ],

    blocos: [
      {
        titulo: 'BLOCO 1\nGramática Visual, UX e Fundamentos de IHC\nMarço — Abril · 8 aulas · Relatório de Marca (2pts)',
        foco: 'Construir o vocabulário visual e conceitual da disciplina — gramática visual, fundamentos de UX e Interação Humano-Computador. A turma aprende a olhar uma interface com olhar crítico antes de conhecer as heurísticas formais. Entrega avaliativa: relatório de análise de marca brasileira (2pts).',
        aulas: [
          {
            id: 'AULA 01', titulo: 'Fundamentos do Design – Conceitos e Perspectivas\n1h20min',
            teoria: 'Teoria (80min):\n• Apresentação do plano da disciplina + Forma de Avaliação\n• Design como produto, processo e função\n• Design na tecnologia e intenção\n• Áreas, subáreas, metodologia e mentalidade\n• Diferenças entre UX, UI, DCU e IxD',
            recurso: 'Recurso: 2 vídeos sobre as perspectivas do design: Ted Talk e Norman Door',
            obs: '', plano_b: '', pratica: '', conexao: '',
          },
          {
            id: 'AULA 02', titulo: 'O que é DCU? — Conceito, Ciclo e Contexto\n1h20min',
            teoria: 'Teoria (40min):\n• (20min) Revisão Breve da aula 01 + Finalização da aula 01\n• DCU: definição e origem (anos 1980, Norman, ISO 9241-210)\n• O ciclo iterativo do DCU: entender → especificar → projetar → avaliar\n• DCU ≠ Design Thinking: disciplinas complementares\n• O guarda-chuva: DCU (filosofia) × UX (resultado) × UI (artefato)',
            pratica: 'Dinâmica (20 min): Professora mostra 3 pares de interfaces (antes/depois de redesigns reais). Alunos identificam "quem pensou no usuário aqui". Mapa mental coletivo DCU × DT × UX × UI construído com a turma no quadro.',
            recurso: 'Slides com exemplos antes/depois de redesigns reais (Airbnb, gov.br, Nubank)',
            obs: 'Aula de ancoragem conceitual. Fundamental para que a Aula 3 (UX) faça sentido dentro de um contexto maior. Conectar ao final: "Na próxima aula vamos mergulhar no UX — agora que vocês sabem onde ele se encaixa".',
            plano_b: '', conexao: '',
          },
          {
            id: 'AULA 03', titulo: 'O que é UX? Experiência além da tela + Design Emocional\n1h20min',
            teoria: 'Teoria (50min):\n• O que é UX (User Experience) — a experiência completa, não só a interface\n• A diferença entre UI e UX. Porque bom design é invisível e mau design grita\n• O conceito de affordance de Don Norman: objetos que comunicam sua função\n• Exemplos cotidianos — porta, torneira, semáforo\n• Como UX se traduz em decisões concretas de interface\n• Microinterações como parte da experiência',
            pratica: 'Debate (20 min): "Cite uma experiência frustrante com um produto digital. O que causou a frustração?" Mapear as frustrações no quadro e conectar com os conceitos de UX.',
            recurso: 'Abertura com cena do documentário "Abstract: The Art of Design" (Netflix) — 8 min do episódio de Paula Scher mostrando como o design guia percepção.\nExemplos de microinterações (like do Instagram, streak do Duolingo)',
            obs: 'Sala de aula invertida: vídeo "The difference between UX and UI" do canal Nielsen Norman Group (YouTube, ~5 min). Postar no Classroom antes.',
            plano_b: 'Se o debate travar: a professora projeta 3 interfaces do cotidiano (app de banco, app de ônibus, gov.br) e pergunta: "Qual você usa com mais prazer? Por quê?"',
            conexao: '',
          },
          {
            id: 'AULA INVERTIDA', titulo: 'UX Aprofundado — Componentes e Design Emocional',
            teoria: 'Será disponibilizado após a aula 03 como complemento extra.\n\n• Os 7 componentes de UX de Morville: útil, usável, desejável, encontrável, acessível, confiável, valioso\n• Design emocional (Norman): visceral, comportamental, reflexivo\n• Como UX se traduz em decisões concretas de interface\n• Microinterações como parte da experiência',
            pratica: 'Exercício-Não-Avaliativo: Em duplas: cada dupla escolhe um app que usa todo dia e mapeia quais dos 7 componentes de Morville estão presentes ou ausentes. Entregar no Classroom: qual componente é mais negligenciado?',
            recurso: 'Slides com honeycomb de Morville',
            obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'NOTA', titulo: 'Orientação da ATV - Relatório de Marca: Durante as aulas 04 e 05 serão trabalhadas análise crítica e analítica de uma marca. Ao final da aula 05 será disponibilizado no Classroom um documento modelo para ter como base.',
            teoria: '', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 04', titulo: 'Gramática Visual — Princípios que Guiam o Olhar\n1h20min',
            teoria: 'Teoria (35 min): Os princípios da Gestalt aplicados a interfaces — proximidade, similaridade, continuidade, figura-fundo. Hierarquia visual: tamanho, cor, peso, posição. Contraste e legibilidade. Espaçamento como linguagem — o vazio também comunica.',
            pratica: 'Prática (45 min): A professora projeta 5 interfaces reais. Para cada uma, os alunos identificam em papel: qual princípio Gestalt está mais evidente? Onde a hierarquia visual direciona o olhar? Há uso inteligente de espaço em branco? Compartilhar achados em duplas.',
            recurso: 'Cena de "O Diabo Veste Prada" — o monólogo do cinto azul celeste (~3 min). Exibir antes da teoria para mostrar que decisões visuais têm impacto real.\n\nA professora projeta 3 exemplos de análise de marca — um excelente, um médio, um fraco — para calibrar as expectativas da entrega.',
            obs: 'Esta aula ainda não fala em heurísticas — foco em educar o olhar visual antes de introduzir o framework formal.',
            plano_b: 'Se os alunos não identificarem os princípios: analisar 1 interface coletivamente no telão antes de liberar a prática individual.',
            conexao: '',
          },
          {
            id: 'AULA 05', titulo: 'Cor e Tipografia — Decisões que Impactam o Usuário\n1h20min',
            teoria: 'Teoria (35 min): Psicologia das cores aplicada a interfaces — quente x fria, saturação, contraste para acessibilidade (WCAG AA: mínimo 4.5:1). Tipografia: serifa vs. sem serifa, hierarquia de tamanhos, linha de leitura, máximo 2 fontes. Como marcas usam cor e tipografia para criar associações emocionais. Exemplos: Nubank, iFood, Mercado Livre.',
            pratica: 'Prática (45 min): Cada aluno escolhe 1 marca brasileira conhecida e analisa: por que essa cor? Por que essa tipografia? O que a marca quer que o usuário sinta? Apresentação rápida de 3–4 alunos.',
            recurso: 'Vídeo "Why do all brands look the same?" do canal Vox (YouTube, ~9 min). Postar no Classroom antes como sala invertida.\n\nA professora projeta 3 exemplos de análise de marca — um excelente, um médio, um fraco.',
            obs: 'Esta aula é a base do relatório avaliativo dos 2pts — a escolha da marca pode começar aqui.',
            plano_b: 'Se a turma não conhecer marcas com bom design: a professora lista 10 marcas brasileiras com identidade visual forte — Nubank, Magazine Luiza, Havaianas, Natura, 99, Quinto Andar, etc.',
            conexao: '',
          },
          {
            id: 'AULA ASSÍNCRONA', titulo: 'Entrega Final do Relatório de Marca — 2pts',
            teoria: '',
            pratica: 'Não será uma aula de fato. A entrega vai ser via Classroom com prazo de 2 semanas.\n\nDisponibilizar no Classroom o documento modelo e um extra informando o que NÃO fazer.\n\nIndividual / dupla / trio — em dupla/trio deve ser marcado quem fez cada parte.\n\nEstrutura obrigatória:\n(1) A marca e o contexto — quem é a empresa, quem é o usuário dela, história da marca\n(2) As escolhas de cor — paleta, psicologia, acessibilidade (passa no WCAG AA?)\n(3) As escolhas tipográficas — fontes usadas, hierarquia, sensação transmitida\n(4) Análise de 2 telas — prints anotados mostrando onde as escolhas visuais impactam a decisão do usuário',
            recurso: '',
            obs: 'Cada aluno escolhe uma marca diferente. Evitar marcas internacionais (Apple, Google, Netflix) — o objetivo é analisar marcas com contexto brasileiro.',
            plano_b: 'Se o aluno não tiver a marca escolhida: a professora sugere 5 opções de acordo com os interesses do aluno (saúde, educação, varejo, transporte, alimentação).',
            conexao: '',
            isEval: true,
          },
          {
            id: 'AULA 06', titulo: 'IHC — Interação Humano-Computador\n1h20min',
            teoria: 'Teoria (30 min): O que é IHC e por que ela existe. Modelos de interação: como o usuário forma expectativas. Feedback e visibilidade — por que o sistema precisa responder a cada ação. Affordances digitais: o que parece clicável, o que parece estático. Erro de design vs. erro do usuário — quando a culpa é da interface.',
            pratica: 'Prática (50 min): Safári de IHC — cada aluno acessa 2 sites/apps no celular e documenta: 1 affordance bem implementada e 1 falha de feedback (ação sem resposta clara). Compartilhar em duplas e apresentar os mais interessantes para a turma.',
            recurso: 'Vídeo "Don Norman: 3 Ways Good Design Makes You Happy" (TED, YouTube, ~15 min). Postar no Classroom antes.',
            obs: '',
            plano_b: 'Se os alunos confundirem affordance com estética: usar o exemplo físico clássico de Norman — a maçaneta que convida a puxar vs. a maçaneta que convida a empurrar.',
            conexao: '',
          },
          {
            id: 'NOTA', titulo: 'Aulas 07 e 08: Usar se alguma aula precisou de mais tempo ou para revisão geral antes do Bloco 2. Se não precisar: aprofundamento de IHC ou exercício adicional de análise visual. Pode ser usado também para forms de revisão do Bloco 1 feito em aula.',
            teoria: '', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '',
          },
        ],
      },
      {
        titulo: 'BLOCO 2\nHeurísticas de Nielsen — Safári de Usabilidade\nMaio — Junho · 9 aulas · Seminário (5pts)',
        foco: 'As 10 heurísticas de Nielsen estudadas em pares — teoria + safári em app real + apresentação dos achados. Ritmo de cada aula de heurística: 20 min de teoria, 40 min de safári, 20 min de apresentação. Ao final do bloco, a turma domina as 10 heurísticas e já sabe aplicá-las em análise real.',
        aulas: [
          {
            id: 'AULA 08', titulo: 'Como Conduzir uma Auditoria Heurística + Escolha do Site para Seminário\n1h20min',
            teoria: 'Teoria (30 min): Processo passo a passo da avaliação heurística · Como documentar problemas: descrição, heurística violada, severidade, evidência visual (print) · Estrutura do relatório de auditoria · O que esperar do seminário de apresentação · Formação dos grupos e escolha do app',
            pratica: 'Safári (40 min): Simulação guiada ao vivo: professora conduz uma auditoria heurística parcial de um app/site simples com a turma acompanhando. Alunos percebem o processo antes de fazer sozinhos. Ao final: grupos formados, apps escolhidos.',
            recurso: 'Slides · Template de relatório de auditoria projetado · App para simulação ao vivo · Lista de apps sugeridos',
            obs: '', plano_b: 'Aula-chave para a qualidade da entrega. Grupos saem com o app aprovado e o template em mãos.', conexao: '',
          },
          {
            id: 'AULA 09', titulo: 'Introdução às Heurísticas + H1 e H2\n1h20min',
            teoria: 'Teoria (30 min): O que são heurísticas de Nielsen e como surgiram. Por que 10? Como aplicar em uma auditoria.\n\nH1 — Visibilidade do status do sistema: o usuário sempre sabe o que está acontecendo (barra de progresso, loading, confirmação de ação).\n\nH2 — Correspondência com o mundo real: o sistema usa linguagem e conceitos familiares ao usuário.',
            pratica: 'Safári (40 min): Em duplas, abrir 1 app no celular e documentar: 1 exemplo de H1 bem aplicado + 1 quebra de H2. Print + justificativa. Apresentação rápida de 3 duplas.',
            recurso: 'User Inyerface (userinyerface.com) — abrir no telão com voluntário. O site quebra todas as heurísticas de propósito. Usar como aquecimento de 8 min antes da teoria.',
            obs: '',
            plano_b: 'Se os alunos confundirem as duas heurísticas: H1 é sobre informação do sistema para o usuário (feedback). H2 é sobre linguagem do sistema ser familiar ao usuário (metáforas). São camadas diferentes.',
            conexao: 'Conexão com PI: "A H1 no contexto do site que vão criar em PI significa: o usuário sabe em qual seção está? Tem indicador visual de localização?"',
          },
          {
            id: 'AULA 10', titulo: 'H3 e H4 — Controle e Consistência\n1h20min',
            teoria: 'H3 — Controle e liberdade do usuário: saídas claramente marcadas, desfazer e refazer, cancelar ações.\n\nH4 — Consistência e padrões: usuários não devem se perguntar se palavras, situações ou ações diferentes significam a mesma coisa.',
            pratica: 'Safári (40 min): Cada aluno analisa um app que usa no dia a dia — documentar 1 exemplo de H3 (momento onde pode ou não pode desfazer algo) e 1 exemplo de H4 (elemento consistente ou inconsistente).',
            recurso: '', obs: '',
            plano_b: 'Se a turma não perceber inconsistências (H4): pedir que comparem o mesmo botão em 3 telas diferentes do mesmo app — cor, texto, posição. Se variar sem razão, é quebra de H4.',
            conexao: '',
          },
          {
            id: 'AULA 11', titulo: 'H5 e H6 — Prevenção e Reconhecimento\n1h20min',
            teoria: 'H5 — Prevenção de erros: design que previne problemas antes de ocorrerem (confirmação de exclusão, validação em tempo real).\n\nH6 — Reconhecimento em vez de recordação: minimizar a carga cognitiva do usuário — opções visíveis, não memorizadas.',
            pratica: 'Safári (40 min): Cada dupla testa um app de e-commerce ou banco — documentar 1 mecanismo de prevenção de erro (H5) e avaliar se a navegação exige memorização (H6).',
            recurso: '', obs: '',
            plano_b: 'Se os exemplos de H5 forem fracos: a professora mostra ao vivo o formulário de um app bancário que não tem confirmação antes de transferir.',
            conexao: 'Conexão com projeto ODS: "No formulário do site de vocês em PI, como vão prevenir erros de preenchimento? Um campo de e-mail com validação em tempo real é H5 aplicada ao código."',
          },
          {
            id: 'AULA 12', titulo: 'H7 e H8 — Eficiência e Minimalismo\n1h20min',
            teoria: 'H7 — Flexibilidade e eficiência de uso: aceleradores para usuários experientes (atalhos, favoritos, histórico).\n\nH8 — Design estético e minimalista: cada elemento adicional compete com a informação relevante. A analogia da Tinkerbell: quanto mais coisas a atenção precisa iluminar, mais fraca fica em cada uma.',
            pratica: 'Safári (40 min): Cada aluno avalia um app quanto ao minimalismo — listar os elementos da tela principal e identificar quais são essenciais e quais são ruído. Redesenhar a tela principal de forma mais minimalista em papel.',
            recurso: 'Analogia da Tinkerbell — se você já assistiu Peter Pan, lembra que a luz de Tinkerbell fica mais fraca quando precisa iluminar muitas coisas ao mesmo tempo. A atenção do usuário funciona igual.',
            obs: '',
            plano_b: 'Se a turma não conseguir identificar o que é "ruído": pedir que cubram 50% dos elementos da tela e verifiquem se o usuário ainda consegue fazer a tarefa principal.',
            conexao: '',
          },
          {
            id: 'AULA 13', titulo: 'H9 e H10 — Erros e Ajuda\n1h20min',
            teoria: 'H9 — Ajudar usuários a reconhecer, diagnosticar e corrigir erros: mensagens de erro em linguagem simples, diagnóstico claro, solução sugerida.\n\nH10 — Ajuda e documentação: embora o melhor sistema não precise de documentação, quando ela existe deve ser fácil de encontrar e orientada a tarefas.',
            pratica: 'Safári (40 min): Cada grupo tenta provocar um erro em um app real (digitar e-mail inválido, tentar salvar sem preencher campo obrigatório) e documenta a mensagem de erro exibida. Avaliar: a mensagem é clara? Sugere solução? Está em linguagem humana?',
            recurso: 'Vídeo "The worst error messages" (YouTube, ~5 min). Compilação de mensagens de erro absurdas. Exibir no início como aquecimento hilário.',
            obs: '',
            plano_b: 'Se os alunos não conseguirem provocar erros nos apps: usar o site gov.br ou qualquer sistema de cadastro público — garantia de erros para analisar.',
            conexao: '',
          },
          {
            id: 'AULA 14', titulo: 'Revisão das 10 Heurísticas e da Auditoria\n1h20min',
            teoria: 'Revisão (30 min): A professora conduz uma revisão rápida das 10 heurísticas — para cada uma, a turma cita 1 exemplo memorável do safári. Construir um "mural das heurísticas" no quadro com os melhores exemplos da turma.',
            pratica: 'Prática (50 min): Cada grupo escolhe o site ou app que vai usar no seminário do Bloco 3. Critérios: deve ser um site/app brasileiro real, diferente do projeto ODS, com ao menos 5 telas para analisar. Começar a auditoria preliminar.',
            recurso: '', obs: 'O site/app escolhido para o seminário deve ser aprovado pela professora até o final desta aula — para evitar que dois grupos escolham o mesmo.',
            plano_b: 'Se dois grupos quiserem o mesmo site: um deles escolhe outro. A professora mantém uma lista dos sites aprovados.',
            conexao: '',
          },
          {
            id: 'AULA 15', titulo: 'Seminários de Auditoria Heurística (Parte 1)\n1h20min',
            teoria: 'Orientação (10 min): Formato — 15 min de apresentação + 5 min de debate. Avaliação: cobertura das heurísticas (mínimo 5), qualidade dos prints anotados, justificativa dos achados, clareza da apresentação.',
            pratica: 'Avaliação (5pts): primeiros grupos apresentam a auditoria heurística do site/app escolhido. Cada grupo deve mostrar: prints com anotações das heurísticas identificadas, se é acerto ou quebra, severidade da quebra (cosmética, grave, catastrófica).',
            recurso: '', obs: 'Apresentação com prints anotados é obrigatória — auditoria sem evidência visual não é auditoria.',
            plano_b: 'Se um grupo não estiver pronto: trocar com a Aula 15.',
            conexao: '', isEval: true,
          },
          {
            id: 'AULA 16', titulo: 'Seminários de Auditoria Heurística (Parte 2)\n1h20min',
            teoria: '',
            pratica: 'Avaliação (5pts): grupos restantes apresentam. Síntese da professora: padrões observados, heurísticas mais frequentemente quebradas, os achados mais surpreendentes.',
            recurso: '', obs: 'Usar os últimos 15 min para debate coletivo — "Se vocês fossem o time de design desse site, qual heurística priorizariam corrigir primeiro? Por quê?"',
            plano_b: '', conexao: '', isEval: true,
          },
        ],
      },
      {
        titulo: 'BLOCO 3\nAuditoria, Seminários e Integração com o Projeto PI\nJunho — Julho · 6 aulas · Seminário (5pts) + Integração PI (3pts)',
        foco: 'Aplicar as heurísticas em auditoria real (seminário = 5pts), produzir o documento de integração com o PI (3pts) e aprofundar dark patterns e acessibilidade. As aulas dão tempo real para preparação dos seminários sem correria.',
        aulas: [
          {
            id: 'AULA INVERTIDA', titulo: 'Dark Patterns — Quando o Design Manipula',
            teoria: 'O que são dark patterns — design que usa as heurísticas ao contrário para enganar ou manipular o usuário. Tipos mais comuns: roach motel (fácil entrar, difícil sair), confirmshaming (culpar quem recusa), misdirection (distração visual), hidden costs (custo escondido). Implicações éticas e legais — LGPD e dark patterns.',
            pratica: 'Exercício-Não-Avaliativo: Em duplas: cada dupla escolhe um app que usa todo dia e procura ativamente dark patterns. Documentar com print + nome do padrão + impacto no usuário.',
            recurso: 'Vídeo "Dark Patterns — Como apps te manipulam" do canal Manual do Usuário (YouTube, em português). Exibir 8 min antes da teoria.',
            obs: '',
            plano_b: 'Se a turma não reconhecer dark patterns: a professora demonstra ao vivo tentando cancelar uma assinatura de streaming.',
            conexao: '',
          },
          {
            id: 'AULA 17', titulo: 'Acessibilidade — Design para Todos\n1h20min',
            teoria: 'Revisão 5min: síntese do seminário — qual heurística a turma mais violou nos apps analisados?\n\nO que é acessibilidade digital e por que é obrigatória. WCAG — as diretrizes internacionais. Contraste de cor (4.5:1 para texto normal), tamanho mínimo de fonte, texto alternativo em imagens (conectar com o atributo alt que será usado em PI), navegação por teclado. A H1 de Nielsen e a acessibilidade — visibilidade para quem usa leitores de tela.',
            pratica: 'Prática (45 min): Cada grupo verifica o site/app do projeto ODS (Figma) usando o WebAIM Contrast Checker. Identifica as cores que não passam no WCAG AA e propõe ajustes.',
            recurso: '',
            obs: '',
            plano_b: 'Se o Figma do projeto ainda não estiver com cores definidas: usar o site atual de uma ODS brasileira como objeto de análise.',
            conexao: 'Conexão com PI: "O atributo alt que vocês vão escrever no HTML é acessibilidade aplicada ao código. Cada imagem sem alt é uma quebra da H1 para usuários cegos."',
          },
          {
            id: 'AULA 18', titulo: 'Usabilidade como Métrica\n1h20min',
            teoria: 'Usabilidade além do "fácil de usar": definição ISO 9241-11 · Eficácia, eficiência e satisfação — o que cada uma mede e como medir · Escala de severidade de Nielsen: 0 (não é problema) a 4 (catastrófico) · Diferença entre avaliação heurística e teste com usuário — quando usar cada uma',
            pratica: 'Prática (50 min): Exercício de classificação: professora apresenta 6 problemas de usabilidade reais descritos em fichas. Alunos classificam individualmente por severidade (0-4), depois comparam e debatem as diferenças de percepção.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA ASSÍNCRONA', titulo: 'Documento de Integração DCU + PI — Entrega Avaliativa',
            teoria: '',
            pratica: 'Cada grupo produz o documento em sala com orientação da professora. Pode ser feito no Google Docs ou Word — o formato é livre, o conteúdo é obrigatório.\n\nEntrega do documento de integração via Classroom até o final da aula ou meia-noite do mesmo dia.',
            recurso: '',
            obs: 'O documento não precisa ser longo — 2 a 3 páginas bem preenchidas valem mais que 10 páginas vazias. O critério de avaliação é a qualidade da conexão entre persona, jornada e decisões de design, não o volume de texto.',
            plano_b: 'Se algum grupo não tiver a jornada do usuário completa: usar os primeiros 20 minutos para finalizar a jornada antes de partir para o documento.',
            conexao: '', isEval: true,
          },
        ],
      },
    ],
  },

  dt: {
    key: 'dt',
    label: 'Design Thinking',
    code: 'DE_233',
    fullname: 'Design Thinking',
    info: 'Módulo 1 · Desenvolvimento de Sistemas [Subsequente]\n40h · 20 encontros de 1h20 · Março a Julho · 3 Blocos\nProjeto Final integrado ao PI — protótipo ODS no Figma',
    avaliacao: `Estrutura Avaliativa — 10 Pontos

• Frame com persona visual no Figma (1pt) — individual — Bloco 1
• Seminários Temáticos (2pts) — grupos — Bloco 2
• Protótipo Delicatte Confeitaria no Figma (1pt) — individual — Bloco 3
• Projeto ODS — Protótipo Figma final (6pts) — grupos — Bloco 3

Temas para o Seminário (cada grupo escolhe 1):
• Cases de Design Thinking
• Empatia como ferramenta de profundidade no usuário
• Prototipagem rápida — ferramentas e técnicas para testar ideias
• Design Inclusivo e Diversidade
• Falhar rápido — a cultura do erro como acelerador de inovação
• Design Thinking no Setor Público
• Design Thinking para Resolver Problemas do Cotidiano`,

    apresentacao: `Esta disciplina ancora as outras duas — a persona e o projeto definidos aqui são os mesmos usados em DCU e PI. O DT é trabalhado em 3 etapas: fundamentos + processo (Bloco 1), métodos avançados + seminários (Bloco 2) e Figma progressivo do wireframe ao protótipo interativo (Bloco 3).

O Figma é ensinado formalmente aqui — DCU e PI apenas usam. As entregas progressivas de Figma garantem que o aprendizado seja gradual. Os mesmos grupos trabalham nas 3 disciplinas — isso reduz a carga cognitiva e fortalece o senso de equipe ao longo dos 6 meses.`,

    seminarioTemas: [
      { num: 1, titulo: 'Cases de Design Thinking', desc: 'Apresentar 2 ou 3 casos reais de empresas (IDEO, Apple, Airbnb, IBM) que usaram o processo de DT para resolver um problema real. Mostrar qual era o problema, qual etapa do DT foi crucial, qual foi a solução e qual foi o resultado. Conectar com o que estamos fazendo em sala.' },
      { num: 2, titulo: 'Empatia como ferramenta de profundidade no usuário', desc: 'Ir além da definição de empatia — mostrar como a empatia muda o resultado do design na prática. Técnicas concretas de entrevista em profundidade: perguntas abertas, técnica dos 5 porquês, shadowing. Conectar com a persona criada em sala.' },
      { num: 3, titulo: 'Prototipagem rápida — ferramentas e técnicas', desc: 'Mostrar diferentes tipos de protótipos (papel, digital, físico, Wizard of Oz) e quando usar cada um. Demonstrar ao vivo como fazer um protótipo de papel de um app em 5 minutos.' },
      { num: 4, titulo: 'Design Inclusivo e Diversidade', desc: 'Casos concretos de produtos que falharam por não considerar determinados grupos de usuários, e como o DT poderia ter evitado isso. Conectar com o projeto ODS da turma.' },
      { num: 5, titulo: 'Falhar rápido — a cultura do erro', desc: 'Ir além do clichê de "errar é aprender" — mostrar o conceito de MVP na prática: Twitter, Instagram, WhatsApp nas versões iniciais. Como ciclos curtos de teste-aprendizado-ajuste poupam dinheiro e tempo.' },
      { num: 6, titulo: 'Design Thinking no Setor Público', desc: 'Casos reais de uso do DT para melhorar serviços públicos — no Brasil ou no mundo. Mostrar os desafios específicos do setor público e como o DT navega esses desafios. Ao menos 2 casos concretos com resultados mensurados.' },
      { num: 7, titulo: 'Design Thinking para o Cotidiano', desc: 'Como o processo do DT pode ser aplicado em escala pequena — não precisa ser uma grande empresa. Apresentar 1 problema cotidiano da vida de um estudante tecnólogo e mostrar como resolveria com DT, passo a passo.' },
    ],

    blocos: [
      {
        titulo: 'BLOCO 1\nFundamentos do DT: Pilares e Processos\nMarço — Abril · 6 aulas · Entrega: frame com persona visual no Figma',
        foco: 'Apresentar o Design Thinking dentro de um contexto maior de inovação. A turma compreende os tipos de inovação, os pilares e o processo completo do DT — e ao longo das aulas vai construindo coletivamente as primeiras etapas do mini projeto guiado (problema, persona, imersão), que servirá de base para o Bloco 3.',
        aulas: [
          {
            id: 'AULA 01', titulo: 'Inovação e Design Thinking — Contexto, Tipos e Pilares\n1h20min',
            teoria: 'Teoria (50 min):\n• Apresentação do plano da disciplina + Forma de Avaliação\n• O que é inovação e por que ela importa no contexto de desenvolvimento de sistemas\n• Tipos de inovação: disruptiva (quebra o mercado — ex: Uber, Netflix), radical (cria algo inédito — ex: surgimento da internet) e incremental (melhoria contínua — ex: atualizações de produto)\n• O que é Design Thinking: origem (IDEO, Stanford d.school), contexto de criação e para que serve\n• Os 3 pilares: empatia, colaboração e experimentação\n• As 5 etapas do processo: Imersão, Definição, Ideação, Prototipação e Teste — apresentação visual do ciclo\n• Design Thinking na Era Digital: Aplicações para Produtos e Serviços Digitais',
            pratica: 'Prática (30 min): Dinâmica de abertura — cada aluno desenha em 1 minuto uma carteira/mochila ideal. Depois entrevista o colega por 3 minutos sobre como usa a carteira de verdade. Redesenha baseado no que ouviu. Debater: o que mudou entre o primeiro e o segundo desenho? Isso é DT.',
            recurso: 'Sala de aula invertida: vídeo "O que é Design Thinking?" do canal Noz Design (YouTube, ~8 min, em português). Postar no Classroom antes.',
            obs: 'Esta dinâmica é a mais citada em livros de DT e funciona mesmo com turmas que nunca ouviram falar no processo. O impacto emocional de ver a diferença entre os dois desenhos é o gancho.',
            plano_b: 'Se a turma travar na entrevista: a professora faz uma demonstração ao vivo entrevistando um voluntário antes de liberar a prática em duplas.',
            conexao: '',
          },
          {
            id: 'AULA 02', titulo: 'Pilares do DT — Empatia, Colaboração e Experimentação\n1h20min',
            teoria: 'Teoria (50 min): Aprofundamento dos 3 pilares.\n\n• Empatia: o que é entender o usuário além do óbvio — diferença entre empatia e simpatia. Técnicas de imersão: observação, entrevista em profundidade, sombra (shadowing). Como fazer uma boa entrevista: perguntas abertas, silêncio produtivo, não sugerir respostas. Mapa de empatia: o que o usuário pensa, sente, faz e fala. Construção de persona.\n• Colaboração: porque equipes multidisciplinares geram soluções mais criativas.\n• Experimentação: a cultura do erro como acelerador — testar rápido, aprender rápido.',
            pratica: 'Prática (30 min): Início do mini-projeto guiado: a professora apresenta o contexto do projeto coletivo que a turma vai desenvolver ao longo dos blocos 1 e 2. Discussão inicial sobre o problema a ser explorado. Todos juntos constroem o mapa de empatia e a persona para o projeto.',
            recurso: '',
            obs: '',
            plano_b: 'Se os alunos ficarem inseguros sobre o que é uma persona: mostrar um exemplo simples no telão — nome, idade, contexto, uma frase que define o problema que essa pessoa enfrenta.',
            conexao: '"A persona que cada um vai criar é o exercício mais individual do semestre — é o momento de olharem sozinhos para o usuário antes de pensar junto. Não precisa ser perfeita, precisa ser pensada."',
          },
          {
            id: 'AULA 03', titulo: '(Etapa 1) Imersão — Pesquisa, Matriz de Alinhamento e Matriz CSD\n1h20min',
            teoria: 'Teoria (40 min): O que é a etapa de Imersão no DT — entender o problema antes de resolver.\n\nFerramentas de Imersão:\n• Pesquisa desk: o que é, quando usar e como fazer uma pesquisa secundária de qualidade (fontes, dados, referências)\n• Matriz de Alinhamento: ferramenta para organizar o que a equipe já sabe sobre o problema e o usuário\n• Matriz CSD (Certezas, Suposições e Dúvidas): como mapear o conhecimento do grupo e identificar onde é preciso pesquisar mais\n• Diagrama de afinidades: agrupar achados por tema',
            pratica: 'Prática (30 min): Construção coletiva no projeto guiado: a professora conduz e vai escrevendo no quadro/telão com a turma. Juntos constroem a Matriz CSD do projeto.',
            recurso: '',
            obs: '',
            plano_b: 'Se a turma tiver dificuldade em distinguir certezas de suposições: a professora dá um exemplo do cotidiano — "Certeza: a loja fecha às 18h. Suposição: os clientes preferem comprar de manhã. Dúvida: por que as vendas caem na sexta?"',
            conexao: '"O problema que vocês vão definir hoje precisa estar relacionado com uma ODS."',
          },
          {
            id: 'AULA 04', titulo: '(Etapa 2) Definição + Persona, Mapa de Empatia e Ponto de Vista\n1h20min',
            teoria: 'Teoria (50 min): O que é a etapa de Definição — transformar o que foi pesquisado em um problema claro.\n\n• Persona: o que é, para que serve e como construir uma (nome, contexto, dores, desejos, comportamentos)\n• Mapa de Empatia: ferramenta para aprofundar a persona — o que o usuário diz, pensa, faz e sente\n• POV (Ponto de Vista): "[Usuário] precisa de [necessidade] porque [insight]" — como sair do problema superficial e chegar na raiz',
            pratica: 'Prática (30 min): A professora conduz no projeto guiado. Será usado o mapa de empatia para escrever 3 POVs diferentes sobre a persona. Votam no mais poderoso. Constroem o diagrama de afinidades com post-its.',
            recurso: '', obs: '',
            plano_b: 'Se a turma tiver dificuldade: a professora dá um exemplo do cotidiano antes e depois aplica ao projeto.',
            conexao: '"O problema que vocês vão definir hoje precisa estar relacionado com uma ODS."',
          },
          {
            id: 'AULA 05', titulo: '(Etapa 3) Ideação: Brainstorming e Geração de Ideias\n1h20min',
            teoria: 'Teoria (50 min): O que é a etapa de Ideação — divergir antes de convergir. Regras do brainstorming eficaz: quantidade antes de qualidade, nenhuma ideia é ruim, construir sobre a ideia do outro. Técnicas: brainwriting, SCAMPER, "e se...?". Como sair do óbvio e gerar soluções que realmente respondem ao POV.',
            pratica: 'Prática (30 min): Sessão de brainstorming coletivo no projeto guiado. Meta mínima de 20 ideias. Professora facilita, escreve e organiza no quadro. Juntos agrupam as ideias e votam nas mais promissoras.',
            recurso: 'Cena do filme "Joy" (2015) onde a protagonista tem o insight do mop — 3 min que mostram como uma ideia surge de observar um problema real.',
            obs: 'O SCAMPER funciona muito bem com turmas que travam no brainstorming — a sigla dá 7 caminhos diferentes para pensar sobre qualquer solução.',
            plano_b: 'Se o brainstorming gerar ideias muito genéricas: usar a técnica "e se...?" ao vivo — "E se o problema fosse 10x maior? E se o usuário fosse cego? E se tivéssemos orçamento ilimitado?"',
            conexao: '',
          },
          {
            id: 'AULA 06', titulo: '(Etapa 4) Prototipação — O que é, Tipos e Dinâmica em Papel\n1h20min',
            teoria: 'Teoria (25 min): O que é prototipagem no DT e por que prototipar cedo. Os três tipos de protótipo: papel (baixíssima fidelidade, rápido e barato), digital (média/alta fidelidade, mais próximo do real) e físico (objetos, maquetes). Quando usar cada tipo. Diferença entre fidelidade baixa e alta.',
            pratica: 'Prática (30 min): Cada aluno (individualmente ou em dupla) protótipa em papel uma tela do projeto guiado — esboço rápido, sem capricho, foco na estrutura. Depois comparam e escolhem os elementos mais claros de cada esboço.',
            recurso: 'Vídeo "Figma for Beginners" (Figma oficial, YouTube) — postar no Classroom antes desta aula como sala invertida.',
            obs: 'A dinâmica de papel é intencional: o objetivo é que eles sintam a liberdade de errar e rabiscar antes de qualquer ferramenta digital. Quem não tem medo de fazer feio no papel, não trava no Figma.',
            plano_b: 'Se os alunos ficarem presos tentando fazer bonito: a professora rabisca intencionalmente no quadro um protótipo "feio" e funcional.',
            conexao: '"No Bloco 3 vocês vão digitalizar exatamente esse processo — só que no Figma."',
          },
        ],
      },
      {
        titulo: 'BLOCO 2\nProcessos Avançados do DT + Storytelling + Seminários\nMaio — Junho · 6 aulas · Seminário temático (2pts)',
        foco: 'Completar o ciclo do DT com as etapas de Teste e Iteração. Introduzir metodologias ágeis e storytelling como ferramentas complementares. Aprofundar temas relevantes do DT em aulas temáticas. Realizar os seminários avaliativos.',
        aulas: [
          {
            id: 'AULA 07', titulo: '(Etapa 5) Testar — Validação e Feedback Real\n1h20min',
            teoria: 'Teoria (50 min): O que é testar no DT — não é apresentar, é aprender. Como conduzir um teste rápido com o protótipo: o usuário usa, você observa. O que anotar: onde hesitou, onde clicou errado, o que disse espontaneamente. A regra de ouro: não explicar — deixar o usuário tentar. Como medir o sucesso de um teste: taxa de conclusão de tarefa, pontos de confusão, feedback verbal.',
            pratica: 'Prática (30 min): Simulação de teste coletivo: a turma "testa" o protótipo em papel criado na aula 06 com colegas de outra equipe. Professora observa e conduz a coleta de feedback.',
            recurso: '', obs: 'Este é o momento mais difícil do DT para iniciantes — ver alguém "errar" no protótipo sem intervir. Preparar a turma: "Resistam à tentação de explicar. O erro do usuário é a informação mais valiosa."',
            plano_b: 'Se o grupo defender o protótipo em vez de testar: pausar e reencaminhar — "Perguntem ao colega: o que você tentou fazer primeiro? Não conte o que deveria ser feito."',
            conexao: '',
          },
          {
            id: 'AULA 08', titulo: 'Iteração, Metodologia Ágil e Product Backlog\n1h20min',
            teoria: 'Teoria (50 min): O que é iteração no DT — voltar e melhorar com base no aprendizado do teste. O ciclo do DT não é linear, é um espiral.\n\nComo priorizar o que mudar: crítico vs. cosmético.\n\nIntrodução à metodologia ágil: o que é, por que surgiu e como se conecta ao DT — o DT define o problema e a solução, o ágil organiza o desenvolvimento.\n\nProduct Backlog: o que é, como montar uma lista priorizada de funcionalidades.\n\nCasos reais de iteração famosa (AirBnB, Instagram, WhatsApp nas versões iniciais).',
            pratica: 'Prática (30 min): Construção coletiva do product backlog do projeto guiado: com base nas ideias e no protótipo em papel, a turma lista as funcionalidades do projeto, prioriza com a professora e cria um backlog simples.',
            recurso: '', obs: '',
            plano_b: 'Se a turma tiver dificuldade em priorizar o backlog: usar a pergunta "Se vocês só pudessem entregar uma coisa, qual seria?" para forçar a escolha.',
            conexao: '',
          },
          {
            id: 'AULA 09', titulo: 'Storytelling e Pitch — Comunicar para Convencer\n1h20min',
            teoria: 'Teoria (40 min): O que é storytelling no DT — contar a história do usuário, não da solução. Estrutura de pitch eficaz: o problema (quem sofre e por quê), a solução (o que você criou), a evidência (o que foi testado), o próximo passo. Como engajar quem ouve em menos de 7 minutos.',
            pratica: '',
            recurso: 'TED Talk "How to pitch a brilliant idea" de Kimberly Elsbach (YouTube, ~15 min). Postar no Classroom antes como sala invertida.',
            obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 10', titulo: 'O Papel da Colaboração Interdisciplinar no Design Thinking\n1h20min',
            teoria: 'Teoria (50 min): Como equipes multidisciplinares — designers, engenheiros, marketing, negócios — geram soluções mais criativas do que grupos homogêneos. O papel de cada perfil no processo do DT. Casos reais de colaboração interdisciplinar bem-sucedida. Como conflitos de visão, quando bem gerenciados, produzem inovação.',
            pratica: 'Prática (30 min): Dinâmica de perspectivas: a turma analisa o projeto guiado sob diferentes ângulos — "O que um engenheiro priorizaria aqui? E alguém de marketing? E o usuário final?" Cada grupo defende um ponto de vista diferente e depois sintetiza.',
            recurso: '', obs: '',
            plano_b: 'Se o debate não engajar: a professora traz um caso concreto (ex: o desenvolvimento do iPhone, onde designers e engenheiros entraram em conflito produtivo).',
            conexao: '',
          },
          {
            id: 'AULA 11', titulo: 'Seminários Temáticos (Parte 1)\n1h20min – 4 equipes',
            teoria: 'Orientação inicial (10 min): formato — 15 min de apresentação + 5 min de debate. Avaliação: clareza, uso de exemplos reais, conexão com DT.',
            pratica: 'Avaliação (2pts): primeiros grupos apresentam o seminário.',
            recurso: '', obs: 'Slides com exemplos visuais são obrigatórios — seminário de DT sem casos reais não engaja.',
            plano_b: 'Se um grupo não estiver pronto: trocar a ordem e apresentar na Aula 12.',
            conexao: '', isEval: true,
          },
          {
            id: 'AULA 12', titulo: 'Seminários Temáticos (Parte 2)\n1h20min – 3 equipes',
            teoria: '',
            pratica: 'Avaliação (2pts): os grupos restantes apresentam o seminário.',
            recurso: '', obs: 'Slides com exemplos visuais são obrigatórios.',
            plano_b: '', conexao: '', isEval: true,
          },
        ],
      },
      {
        titulo: 'BLOCO 3\nFigma Progressivo — Do Wireframe ao Protótipo\nJunho — Julho · 8 aulas · Exercício Delicatte (1pt) + Projeto ODS',
        foco: 'Aprender Figma do zero ao protótipo interativo através de um exercício individual progressivo — a loja Delicatte Confeitaria. Os alunos acompanham a professora passo a passo, evoluindo da baixa fidelidade (wireframe) até a alta fidelidade completa com prototype interativo. Ao dominar o processo na Delicatte, aplicam o mesmo conhecimento no projeto ODS.',
        aulas: [
          {
            id: 'AULA 13', titulo: 'Prototipação de Baixo Nível (Parte 1)\n1h20min',
            teoria: 'Teoria (20 min): O que é prototipagem de baixa fidelidade e por que começar assim. No Figma: criar conta, criar novo arquivo, configurar frame mobile (390x844px — iPhone 14). Conhecer a interface: layers, ferramentas de forma, texto, cores. Conceito de wireframe: só estrutura, sem cor, sem imagem ainda.',
            pratica: 'Figma — Baixa Fidelidade Parte 1 (60 min): Criar os 4 frames: Login, Home, Produto, Carrinho. Tela de Login: logo placeholder (retângulo + texto "Delicatte"), campo e-mail, campo senha, botão entrar. Tudo em preto, branco e cinza. Só formas e texto — sem cor ainda.',
            recurso: '',
            obs: '',
            plano_b: 'Se o Figma travar por internet ou instalação: usar figma.com no navegador (não precisa instalar). Se algum aluno não conseguir criar conta: fazer em dupla com colega.',
            conexao: '"O que vocês estão aprendendo hoje na Delicatte é exatamente o que vocês vão fazer no projeto ODS."',
          },
          {
            id: 'AULA 14', titulo: 'Prototipação de Baixo Nível (Parte 2)\n1h20min',
            teoria: 'Teoria (15 min): Recapitulação da aula anterior — cada aluno deve ter os 4 frames criados. Revisar pontos que geraram dúvidas. Apresentar os elementos que vamos adicionar hoje: retângulos com bordas arredondadas, ícones simples com formas geométricas, hierarquia de texto.',
            pratica: 'Figma — Baixa Fidelidade Parte 2 (65 min): Completar e refinar os 4 frames. Home: grid de produtos 2x2 com retângulos placeholders, barra de busca, cabeçalho com nome da loja. Produto: imagem placeholder grande, nome, preço, descrição, botão "Adicionar ao Carrinho". Carrinho: lista de itens, subtotal, botão finalizar. Wireframe completo ao final da aula.',
            recurso: '', obs: '',
            plano_b: 'Se algum aluno estiver atrasado: focar em terminar as 3 telas principais (Login, Home, Produto). Um wireframe de 3 telas completo é melhor que 4 telas incompletas.',
            conexao: '',
          },
          {
            id: 'AULA 15', titulo: 'Prototipação de Médio Nível (Parte 1)\n1h20min',
            teoria: 'Teoria (20 min): O que muda da baixa para a média fidelidade: entrada das cores, tipografia e ícones reais.\n\nPaleta da Delicatte:\n• #860120 Vinho — botões e destaque\n• #fad1da Rosa claro — fundos de card\n• #fffbef Creme — background\n• #828f58 Verde oliva — tags e badges\n\nComo aplicar cor no Figma: Fill, Stroke, opacidade. Como trocar a fonte no Figma.',
            pratica: 'Figma — Média Fidelidade Parte 1 (60 min): Aplicar as cores da paleta nas 4 telas seguindo a professora. Background de todas as telas: #fffbef. Cabeçalho e botões principais: #860120 com texto branco. Cards de produto: background #fad1da. Tags e indicadores: #828f58. Aplicar tipografia: escolher 2 fontes no Google Fonts dentro do Figma.',
            recurso: '', obs: '',
            plano_b: 'Se algum aluno confundir as cores: projetar a tela da professora no telão e comparar ao vivo.',
            conexao: '',
          },
          {
            id: 'AULA 16', titulo: 'Prototipação de Médio Nível (Parte 2)\n1h20min',
            teoria: 'Teoria (20 min): Recapitulação das cores aplicadas. Apresentar o conceito de componente no Figma: um elemento criado uma vez e reutilizado em várias telas. Por que usar componentes: consistência e eficiência. Mostrar como criar um componente (Ctrl+Alt+K) e como usar instâncias. A nav bar da Delicatte: 4 ícones (Home, Categoria, Carrinho, Perfil).',
            pratica: 'Figma — Média Fidelidade Parte 2 + Nav Bar (60 min): Finalizar detalhes visuais de média fidelidade nas 4 telas. Criar a nav bar como componente: fundo branco, 4 ícones usando formas simples ou Iconify plugin, altura 60px. Inserir instâncias da nav bar nas telas Home, Produto e Carrinho. Garantir que a nav bar aparece idêntica nas 3 telas.',
            recurso: '', obs: '',
            plano_b: 'Se o plugin Iconify não carregar: usar formas geométricas simples para representar os ícones. O conceito de componente é mais importante que o visual perfeito.',
            conexao: '',
          },
          {
            id: 'AULA 17', titulo: 'Prototipação de Alto Nível (Parte 1)\n1h20min',
            teoria: 'Teoria (20 min): O que muda da média para a alta fidelidade: imagens reais, sombras, arredondamento refinado, espaçamento preciso. Apresentar o Unsplash no Figma (plugin): como buscar e inserir fotos de qualidade. Mostrar como recortar imagem em forma (Fill de frame). Espaçamento: padding interno dos elementos, distância entre componentes.',
            pratica: 'Figma — Alta Fidelidade Parte 1 (60 min): Substituir os retângulos placeholder por imagens reais do Unsplash — fotos de doces, bolos, tortas para os produtos; foto de ambiente para o banner da Home. Refinar os cards: borda arredondada (8px), sombra sutil (drop shadow: 0 2px 8px, opacidade 15%). Ajustar espaçamentos internos.',
            recurso: '', obs: '',
            plano_b: 'Se o plugin Unsplash não estiver disponível: usar o site unsplash.com no navegador, baixar as imagens e importar no Figma.',
            conexao: '',
          },
          {
            id: 'AULA 18', titulo: 'Alta Fidelidade Parte 2 — Refinamento Final\n1h20min',
            teoria: 'Recapitulação (15 min): Detalhes finais que elevam o nível: tipografia com hierarquia clara (título 24px bold, subtexto 14px regular, preço 18px bold), espaçamento interno dos cards (padding 16px), botões com bordas arredondadas (border-radius 8px). Cada detalhe tem uma razão de UX.',
            pratica: 'Figma — Alta Fidelidade Parte 2 (65 min): Refinamento completo das 4 telas.\n• Tela de Login: logo Delicatte em tipografia elegante, campos com borda arredondada, botão vinho\n• Home: banner de destaque com imagem + texto sobreposto, grid de produtos com sombra nos cards\n• Produto: imagem em destaque, preço em vinho, botão grande "Adicionar ao Carrinho"\n• Carrinho: lista de itens, preço total em destaque, botão "Finalizar Pedido"',
            recurso: '', obs: '',
            plano_b: 'Se algum aluno ainda estiver na média fidelidade: focar em finalizar as telas Login e Home em alta fidelidade. Duas telas excelentes valem mais que quatro medianas.',
            conexao: '',
          },
          {
            id: 'AULA 19', titulo: 'Prototype — Conectando as Telas + Entrega\n1h20min',
            teoria: 'Teoria (20 min): O que é o modo Prototype no Figma: criar conexões entre telas simulando o comportamento de um app real. Como criar uma conexão: selecionar elemento → aba Prototype → arrastar para a tela destino. Tipos de transição: Instant, Dissolve, Slide In. Como testar o protótipo: botão Play (▶).',
            pratica: 'Figma — Prototype (60 min): Conectar as 4 telas seguindo o fluxo:\n• Botão "Entrar" do Login → Home\n• Card de produto da Home → tela Produto\n• Botão "Adicionar ao Carrinho" → Carrinho\nAdicionar conexões dos ícones da nav bar entre as telas. Testar o fluxo completo no modo Play.\n\nEntrega avaliativa Bloco 3 (1pt): link do protótipo interativo da Delicatte Confeitaria com mínimo 3 telas conectadas, enviado via Classroom até o final da aula.',
            recurso: '', obs: '',
            plano_b: 'Se o modo Prototype travar: conectar apenas o fluxo principal (Login → Home → Produto) e enviar. Três telas conectadas já demonstram o conceito. O que não pode faltar é o link compartilhado.',
            conexao: '', isEval: true,
          },
          {
            id: 'AULA 20', titulo: 'Ajustes Finais no Projeto ODS / Retrospectiva\n1h20min',
            teoria: '⚠️ Esta aula depende do calendário: se ocorrer ANTES do evento final, o foco é acompanhamento e ajustes no projeto ODS de cada grupo no Figma. Se ocorrer DEPOIS do evento final, o foco é retrospectiva.',
            pratica: 'SE ANTES DO EVENTO — Acompanhamento final (80 min): Cada grupo trabalha no Figma do projeto ODS com orientação individual da professora. Foco: coerência visual com a persona, fluxo de 3 telas funcionando no modo Prototype, paleta e tipografia consistentes. A professora valida se o processo DT está visível no design.\n\nSE DEPOIS DO EVENTO — Retrospectiva (80 min): Cada aluno responde: O que aprendi sobre DT que vou usar na vida? Qual etapa do processo foi mais difícil? O que mudaria no meu projeto se recomeçasse?',
            recurso: '', obs: '',
            plano_b: '',
            conexao: '"DT → DCU → PI: O Figma que vocês dominaram aqui é a ferramenta de todo o projeto ODS. Em PI vocês vão apresentar esse protótipo ao vivo. Em DCU as heurísticas de Nielsen estão aplicadas nesse design. Tudo que vocês fizeram neste semestre converge no evento final."',
          },
        ],
      },
    ],
  },

  pi: {
    key: 'pi',
    label: 'PI',
    code: 'DS_PI',
    fullname: 'Projeto Integrador I',
    info: 'Módulo 1 · Desenvolvimento de Sistemas\n80h total · 20 aulas presenciais de 1h20 · Março a Julho\nHTML5 + CSS3 (Portfólio + Mini-projeto) · Protótipo Final ODS (Figma)',
    avaliacao: `Estrutura Avaliativa — 10 Pontos

• Portfólio Individual publicado no GitHub Pages (1pt) — Bloco 2
• Mini-projeto prático individual (1pt) — linkado no portfólio — Bloco 2
• Projeto Final ODS (8pts) — grupos — Bloco 3

Subcritérios do Projeto Final ODS (8pts):
• Figma — protótipo de alta fidelidade navegável
• Trello — organização do projeto em sprints
• Apresentação (pitch de 7 min com navegação ao vivo)
• Validação das heurísticas de Nielsen pela professora de DCU`,

    miniProjetos: [
      { num: '01', nome: 'Layout de Blog', desc: 'Cabeçalho, barra lateral, lista de postagens e rodapé.' },
      { num: '02', nome: 'Formulário de Cadastro', desc: 'Campos de nome, e-mail, senha e botão de envio.' },
      { num: '03', nome: 'Página de Login', desc: 'Campos de usuário e senha, botão de login, layout simples.' },
      { num: '04', nome: 'Landing Page de Produto', desc: 'Imagens, descrição do produto e botão de chamada à ação (CTA).' },
      { num: '05', nome: 'Menu de Navegação Responsivo', desc: 'Menu que muda de formato entre desktop e mobile.' },
      { num: '06', nome: 'Galeria de Imagens', desc: 'Grade de fotos com efeito de hover para ampliar.' },
      { num: '07', nome: 'Tabela de Preços', desc: 'Planos estilizados com cores e bordas para destacar informações.' },
      { num: '08', nome: 'Cartão de Contato', desc: 'Layout de cartão de visita com nome, cargo, telefone e e-mail.' },
      { num: '09', nome: 'Animação de Hover em Botões', desc: 'Botão com efeito de mudança de cor ou animação ao passar o mouse.' },
    ],

    blocos: [
      {
        titulo: 'BLOCO 1\nHTML5 — A Estrutura de Tudo\nMarço — Abril · 6 aulas · Do ambiente de desenvolvimento ao HTML semântico completo',
        foco: 'A turma sai do zero absoluto e chega ao HTML semântico completo através de um projeto guiado pela professora: a construção de um Portfólio Pessoal. Ao mesmo tempo, os alunos devem escolher 1 dos 9 mini-projetos práticos para desenvolverem sozinhos (ex: página de login, blog, etc) aplicando o que aprenderam.',
        aulas: [
          {
            id: 'AULA 01', titulo: 'Como a Web Funciona + Ambiente de Desenvolvimento\n1h20min presencial',
            teoria: 'Teoria (40 min):\n• Apresentação da Disciplina + Forma de Avaliação\n• O que é um portfólio de desenvolvedor. Estrutura mínima: foto/avatar, nome, descrição breve, habilidades aprendidas no semestre e, o mais importante, a inclusão do link em destaque para o Mini-projeto prático individual escolhido.\n• O que acontece quando você digita uma URL — cliente, servidor, HTTP. O papel do HTML (estrutura), CSS (visual) e JS (comportamento).\n• Apresentação do VS Code: instalação, extensões essenciais — Live Server, Prettier, Auto Rename Tag. O que é o GitHub e por que vamos usar.',
            codealong: 'Code-along (40 min): Instalar VS Code. Criar conta no GitHub. Criar o repositório da disciplina. Primeiro arquivo index.html com doctype e estrutura básica — será o projeto guiado que acompanha o Bloco 1 e 2. Abrir com Live Server. Primeiro commit.',
            recurso: '', obs: 'Verificar antecipadamente se os computadores permitem instalação. Alternativa online: vscode.dev no navegador. GitHub pode ser usado via interface web se git causar problemas.',
            plano_b: 'Se a instalação travar: usar vscode.dev + repositório GitHub diretamente pelo navegador. O conceito é o mesmo.',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 02', titulo: 'HTML5 — Estrutura Base e Tags Essenciais de Texto\n1h20min presencial',
            teoria: 'Teoria (25 min): Anatomia do HTML — tag, atributo, elemento, aninhamento. Tags obrigatórias: html, head, body. No head: title, meta charset, meta viewport (fundamental — sem isso o site quebra no celular). Tags de texto: h1–h6 (hierarquia e SEO), p, strong, em. A regra: 1 h1 por página.',
            codealong: 'Code-along (55 min): Construir a estrutura base do Portfólio Pessoal com head completo. Inserir os títulos e parágrafos principais do site seguindo a hierarquia visual do Figma — "o h1 do HTML é o título principal do Figma." Commit com mensagem descritiva.',
            recurso: '', obs: '',
            plano_b: 'Se a meta viewport for esquecido: mostrar ao vivo no DevTools mobile o site com e sem o viewport. O impacto é imediato e inesquecível.',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 03', titulo: 'HTML5 — Imagens, Links e Atributos de Acessibilidade\n1h20min presencial · EAD como extensão',
            teoria: "Teoria (25 min): tag img — src, alt (obrigatório — acessibilidade + SEO), width, height. Formatos: JPG (fotos), PNG (transparência), SVG (ícones). tag a — href, target='_blank', rel='noopener'. Pasta /images organizada. Por que o alt é ético além de técnico.",
            codealong: 'Code-along (55 min): Inserir todas as imagens do portfólio pessoal com alt descritivo em todas. Adicionar links de navegação entre seções. Organizar a pasta /images. Commit.',
            recurso: '', obs: '',
            plano_b: "Se os alunos deixarem o alt vazio ou com 'imagem': mostrar ao vivo um leitor de tela (NVDA gratuito ou VoiceOver do Mac) lendo uma página sem alt — o impacto emocional é pedagógico.",
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 04', titulo: 'HTML5 — Tags Semânticas\n1h20min presencial · EAD como extensão',
            teoria: 'Teoria (25 min): Por que semântica existe — SEO, acessibilidade, manutenção. As tags: header, nav, main, section, article, aside, footer. A diferença entre div (não diz nada) e section (tem propósito semântico). Como o Figma mapeia para as tags semânticas — o header do Figma é o header do HTML.',
            codealong: "Code-along (55 min): Reestruturar todo o HTML do projeto usando tags semânticas. Cada seção do Figma vira uma section com id. Nav com os links de navegação. Footer com rodapé. Commit com mensagem 'refatoração: HTML semântico'.",
            recurso: '', obs: '',
            plano_b: "Se a turma resistir à semântica ('por que não usar div em tudo?'): mostrar a diferença nos resultados do Google — sites com HTML semântico aparecem antes.",
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 05', titulo: 'HTML5 — Formulários e Validação Nativa\n1h20min presencial · EAD como extensão',
            teoria: 'Teoria (25 min): A tag form. Inputs: text, email, password, number, date, checkbox, radio. select, textarea, button. label e for — por que é obrigatório (acessibilidade). Validação nativa: required, minlength, type=email. A H5 de Nielsen no HTML — prevenir erros antes de acontecerem.',
            codealong: 'Code-along (55 min): Criar o formulário de contato ou cadastro do portfólio. Todos os campos com label associado. Validação nativa nos campos principais. Testar a validação no navegador. Commit.',
            recurso: '', obs: '',
            plano_b: 'Se os alunos não associarem label ao input: mostrar ao vivo que sem a associação o clique no label não foca no campo — comportamento inesperado que quebra a H3 (controle do usuário).',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 06', titulo: 'HTML5 — Tabelas, Listas, Multimídia e Validação Final\n1h20min presencial · EAD como extensão',
            teoria: 'Teoria (20 min): Listas: ul, ol, li — quando usar cada uma. Tabelas: table, thead, tbody, tr, th, td — para dados tabulares, nunca para layout. tag video e iframe para incorporar conteúdo externo.',
            codealong: 'Code-along (60 min): Adicionar ao projeto os elementos restantes — lista de conteúdo relevante, tabela de dados se aplicável, vídeo ou iframe de conteúdo. Validação final do HTML no W3C. Commit de fechamento do Bloco 1.',
            recurso: '', obs: 'Este é o checkpoint do Bloco 1. O HTML deve estar completo, semântico e validado antes de passar ao CSS. A professora revisa rapidamente o repositório de cada grupo no final da aula.',
            plano_b: 'Se houver muitos erros no validador: focar nos críticos (tags não fechadas, atributos obrigatórios ausentes). Deixar avisos para correção via EAD.',
            pratica: '', conexao: '',
          },
        ],
      },
      {
        titulo: 'BLOCO 2\nCSS3 — Do Estilo ao Layout Responsivo\nMaio — Junho · 6 aulas · Portfólio individual + projeto ODS ganha visual fiel ao Figma',
        foco: 'Aplicar CSS3 progressivamente sobre o HTML do Portfólio Pessoal (cores, tipografia, Flexbox, responsividade). Os alunos aproveitam para finalizar o estilo visual de seus mini-projetos individuais. A entrega avaliativa (2pts) ocorre na Aula 12: o portfólio no ar com o mini-projeto funcionando e linkado dentro dele.',
        aulas: [
          {
            id: 'AULA 07', titulo: 'CSS3 — Seletores, Cascata e Primeiras Cores\n1h20min presencial',
            teoria: 'Teoria (25 min): Como linkar o CSS. Sintaxe: seletor { propriedade: valor; }. Seletores de tag, classe (.classe) e ID (#id). Cascata e especificidade — por que algumas regras ganham de outras. Variáveis CSS: --cor-primaria, --fonte-principal. Cores: hex, rgb, hsl.',
            codealong: 'Code-along (55 min): Criar style.css e linkar. Criar as variáveis CSS com as cores do Figma — copiar os valores hex diretamente. Aplicar a cor de fundo, cor de texto principal e a fonte primária via Google Fonts. Commit.',
            recurso: '', obs: 'Criar variáveis CSS desde o início. Quem não usar variáveis vai sofrer quando precisar mudar a cor primária — isso vai acontecer.',
            plano_b: 'Se o CSS não aplicar: verificar o caminho do href no link — é o erro mais comum e mais frustrante. Mostrar o DevTools como aliado.',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 08', titulo: 'CSS3 — Tipografia e Box Model\n1h20min presencial',
            teoria: 'Teoria (25 min): Tipografia: font-size (rem vs px — por que rem é melhor), font-weight, line-height, letter-spacing. Box model: conteúdo + padding + border + margin. box-sizing: border-box — por que aplicar em tudo com *. A metáfora do embrulho de presente.',
            codealong: 'Code-along (55 min): Aplicar tipografia completa seguindo a hierarquia do Figma — h1, h2, h3, p com tamanhos proporcionais. Usar box model para criar espaçamento entre seções. Abrir o DevTools e inspecionar o box model visualmente. Commit.',
            recurso: '', obs: '',
            plano_b: 'Se o box model confundir: usar a visualização gráfica do DevTools (aba Computed > Box Model). Ver o visual resolve em 2 minutos o que explicação verbal leva 10.',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 09', titulo: 'CSS3 — Flexbox\n1h20min presencial',
            teoria: 'Teoria (25 min): O problema que o Flexbox resolve. display:flex, flex-direction, justify-content, align-items, flex-wrap, gap. Os 3 casos de uso mais comuns: nav horizontal, cards lado a lado, centralizar elemento na tela.',
            codealong: "Code-along (55 min): Aplicar Flexbox no cabeçalho (logo + nav alinhados), na seção de cards do portfólio e em pelo menos 1 elemento centralizado. O Figma como referência — 'esses cards estão lado a lado no Figma, Flexbox é como fazemos isso.' Commit.",
            recurso: '', obs: 'Mostrar o Flexbox Froggy (flexboxfroggy.com) durante a aula nos últimos 10 min como gamificação.',
            plano_b: 'Se o Flexbox causar confusão: focar nos 3 casos de uso mais comuns sem tentar ensinar todas as propriedades.',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 10', titulo: 'CSS3 — Grid e Responsividade\n1h20min presencial',
            teoria: 'Teoria (25 min): CSS Grid para layouts de 2 e 3 colunas — display:grid, grid-template-columns, gap, fr unit. Media queries: @media (max-width: 768px). Mobile-first — por que começar pelo menor tamanho. Como o Figma mobile (375px) corresponde ao breakpoint mobile do CSS.',
            codealong: 'Code-along (55 min): Aplicar Grid em pelo menos 1 seção do projeto (galeria, cards em 3 colunas). Adicionar media queries para adaptar o layout a mobile — testar no DevTools com o modo de dispositivo móvel. Commit.',
            recurso: '', obs: '',
            plano_b: 'Se as media queries não aplicarem: verificar se o meta viewport está no HTML (Aula 02). Sem ele, media queries não funcionam em dispositivos reais.',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 11', titulo: 'CSS3 — Pseudo-classes, Transições e Organização\n1h20min presencial',
            teoria: 'Teoria (25 min): Pseudo-classes: :hover, :focus, :active. Transições: transition com duration e ease. Por que o :focus visível é acessibilidade — nunca remover sem substituir. Organização do CSS: variáveis → reset → base → componentes → layout → responsivo.',
            codealong: 'Code-along (55 min): Adicionar hover e transição nos botões e links. Garantir :focus visível em todos os elementos interativos. Reorganizar o CSS em seções com comentários. Commit de organização.',
            recurso: '', obs: '',
            plano_b: 'Se o CSS estiver desorganizado a esta altura: a professora projeta o arquivo de 1 grupo como exemplo coletivo de refatoração — sem identificar o grupo.',
            pratica: '', conexao: '',
          },
          {
            id: 'AULA 12', titulo: 'Portfólio Individual + Mini-projeto (Validação HTML/CSS)\n1h20min presencial',
            teoria: '',
            pratica: 'Entrega avaliativa (2pts): Link do portfólio publicado no GitHub Pages (1pt) + link funcional para o Mini-projeto prático individual totalmente estilizado (1pt). Entrega via Classroom até o final do dia.',
            codealong: '', recurso: '',
            obs: 'GitHub Pages é gratuito e publica qualquer repositório como site. Configurar em Settings > Pages > Branch: main. Em 1–2 minutos o site está no ar.',
            plano_b: 'Se o GitHub Pages não publicar: verificar se o arquivo se chama exatamente index.html (case sensitive). Esse é o erro mais comum.',
            conexao: '', isEval: true,
          },
        ],
      },
      {
        titulo: 'BLOCO 3\nProjeto Final ODS — Figma e Trello\nJunho — Julho · 8 aulas · Sprint final do projeto ODS + apresentação integrada',
        foco: 'Construir do zero o protótipo do projeto ODS em Figma — baixa, média e alta fidelidade — até o prototype interativo. O processo segue os pilares do DT aprendidos na disciplina de Design Thinking. A apresentação final é o pitch de 7 minutos com navegação ao vivo no Figma. A professora de DCU valida as heurísticas durante a apresentação.',
        aulas: [
          { id: 'AULA 13', titulo: 'Sprint 1: Kickoff e Documentação\n2h40min presencial', pratica: 'Definição do tema ODS e criação do board no Trello. Construção da persona e demais documentos.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 14', titulo: 'Sprint 2: Documentação + Baixa Fidelidade\n2h40min presencial', pratica: 'Finalização das documentações e construção dos primeiros frames de baixa fidelidade no Figma — mínimo 3 telas esboçadas.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 15', titulo: 'Sprint 3: Baixa Fidelidade\n2h40min presencial', pratica: 'Todas as telas em baixa fidelidade finalizadas. Fluxo de navegação mapeado. Feedback da professora em cada grupo.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 16', titulo: 'Sprint 4: Média Fidelidade\n2h40min presencial', pratica: 'Paleta de cores e tipografia definidas e aplicadas. Cabeçalho, botões e cards com estilo consistente.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 17', titulo: 'Sprint 5: Alta Fidelidade\n2h40min presencial', pratica: 'Imagens reais aplicadas via Unsplash. Refinamento de espaçamentos e hierarquia visual. Todas as telas em alta fidelidade.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 18', titulo: 'Sprint 6: Prototype e Ajustes Finais\n2h40min presencial', pratica: 'Telas conectadas no modo Prototype. Fluxo navegável testado. Documentos do projeto organizados para entrega.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 19', titulo: 'Sprint 7: Prototype e Ajustes Finais\n2h40min presencial', pratica: 'Telas conectadas no modo Prototype. Fluxo navegável testado. Documentos do projeto organizados para entrega.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 20', titulo: 'Apresentação Final\n2h40min presencial', pratica: 'Pitch de 7 minutos por grupo. Navegação ao vivo no Figma. Avaliação integrada com DCU.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '', isEval: true },
        ],
      },
    ],
  },

  dim: {
    key: 'dim',
    label: 'DIM',
    code: 'DE_242',
    fullname: 'Design de Interfaces Mobile',
    info: 'Módulo 3 · Desenvolvimento de Sistemas [Subsequente]\n40h · 20 encontros de 1h20 · Março a Julho\nUI Mobile, Android vs. iOS, Gestos, Figma Avançado e Componentização.\nProjeto: Protótipo Mobile de Alta Fidelidade (App de Startup).',
    avaliacao: `Estrutura Avaliativa — 10 Pontos

• Análise heurística do app escolhido (2pts) — individual — Bloco 1
• Seminários Temáticos (2pts) — grupos — Bloco 1
• Projeto Delicatte Confeitaria no Figma (1pt) — individual — Bloco 2
• Projeto Final — App Startup (5pts) — grupos — Bloco 3

Detalhamento do Projeto Final (5pts):
• Trello com sprints organizados (1pt)
• Justificativas visuais no pitch (2pts)
• Qualidade e navegação do Figma (2pts)

Temas para o Seminário (cada grupo escolhe 1):
• Material Design (Google) — princípios, componentes e aplicações reais
• Human Interface Guidelines (Apple) — filosofia iOS e diferenças em relação ao Android
• Dark Patterns Mobile — como apps manipulam usuários e as implicações éticas
• Acessibilidade em interfaces mobile — WCAG, contraste, tamanho de toque
• Tendências de UI Mobile — glassmorphism, neumorphism, dark mode, design minimalista
• Cases de redesign famosos — apps que melhoraram ou pioraram após atualização de design`,

    briefingsStartup: [
      'Delivery Local',
      'PetShop',
      'Barbearia',
      'Academia de Ginástica',
      'Escola de Idiomas',
    ],

    blocos: [
      {
        titulo: 'BLOCO 1\nTeoria UI: Ergonomia, Componentes e Plataformas\nMarço — Abril · 8 aulas',
        foco: 'Dar toda a base teórica de como funciona o design para telas pequenas. Focar na ergonomia física do celular, gramática visual, guias oficiais e padrões de navegação. Fechar o bloco com os seminários teóricos, garantindo que os alunos saibam o porquê antes de aprenderem o como (Figma).',
        aulas: [
          {
            id: 'AULA 01', titulo: 'Fundamentos do Design – Conceitos e Perspectivas\n1h20min',
            teoria: 'Teoria (80min):\n• Apresentação do plano da disciplina + Forma de Avaliação\n• Design como produto, processo e função\n• Design na tecnologia e intenção\n• Áreas, subáreas, metodologia e mentalidade\n• Diferenças entre UX, UI, DCU e IxD',
            recurso: 'Recurso: 2 vídeos sobre as perspectivas do design: Ted Talk e Norman Door',
            obs: '', plano_b: '', pratica: '', conexao: '',
          },
          {
            id: 'AULA 02', titulo: 'O que é UI Mobile? Contexto e Ecossistema\n1h20min',
            teoria: 'Teoria (60 min): O que é interface móvel e por que é diferente do desktop — tela pequena, toque, contexto de uso em movimento. Android vs. iOS: as duas plataformas e suas filosofias. Por que o design mobile exige escolhas mais rigorosas — cada pixel tem peso.',
            pratica: 'Debate (20 min): "Qual app do seu celular você acha bonito? Qual você considera mal projetado? O que faz a diferença?" Cada aluno apresenta 1 exemplo. A professora mapeia no quadro os padrões.',
            recurso: 'Sala de aula invertida: vídeo "What is UI Design?" do canal DesignCourse (YouTube, ~10 min).',
            obs: 'Esta aula ainda não usa nenhuma ferramenta — foco total em observar e debater. A primeira impressão deve ser de curiosidade, não de intimidação com software.',
            plano_b: 'Se o debate travar: a professora projeta 3 pares de apps — um bem projetado vs. um mal projetado do mesmo segmento.',
            conexao: '',
          },
          {
            id: 'AULA 03', titulo: 'O Corpo e a Tela: Ergonomia Mobile\n1h20min',
            teoria: 'Teoria (45 min): A diferença entre Web e Mobile. O impacto do contexto: uso na rua, no sol, com uma mão só. A Regra do "Dedo Gordo" (Fat Finger) e o tamanho mínimo de toque (44x44px). A "Thumb Zone" (Zona do Polegar): onde é fácil clicar e onde dói o dedo.',
            pratica: 'Debate (35 min): "Qual app do seu celular você ama usar com uma mão só? Qual te irrita?" Mapeando os padrões visuais no quadro.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 04', titulo: 'Gramática Visual — Cor, Tipografia e Hierarquia\n1h20min',
            teoria: 'Teoria (60 min): Os princípios visuais fundamentais: hierarquia (para onde o olho vai primeiro), contraste, alinhamento e espaçamento.\n\nCor no mobile — temperatura, paleta de 3 cores (primária, secundária, neutra). Regra do 60-30-10.\n\nTipografia mobile: tamanhos mínimos de leitura, máximo 2 fontes, como criar hierarquia com tamanho e peso.\n\nA matemática do espaço: a Regra dos Múltiplos de 8px e a importância do respiro (espaço em branco).',
            pratica: 'Prática (20 min): A Análise em papel. A professora projeta telas reais e os alunos identificam onde está o peso visual, a cor primária e a hierarquia.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 05', titulo: 'Padrões de Navegação e Componentes\n1h20min',
            teoria: 'Teoria (40 min): O "Lego" do UI Design. Como o usuário anda pelo App: Bottom Navigation Bar vs. Tabs vs. Hamburger Menu. Anatomia dos botões (Primary, Secondary, Ghost). Formulários mobile amigáveis.',
            pratica: 'Prática (35 min): Pegar um menu governamental confuso projetado no telão e redesenhar em papel a estrutura correta de navegação usando uma Bottom Bar.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 06', titulo: 'Interação, Gestos e Feedback Visuais + Android vs. iOS\n1h20min',
            teoria: 'Teoria (50 min): A tela estática não existe. Gestos invisíveis (Swipe, Pinch, Long Press) e seus riscos. Microinterações (loading, like) e a necessidade absoluta de Feedback Visual.\n\nAs duas filosofias de design mobile:\n• Material Design (Google): elevação, sombras, movimento com propósito\n• Human Interface Guidelines (Apple): clareza, deferência, profundidade\n• Diferenças práticas: navegação, gestos, tipografia padrão de cada plataforma',
            pratica: 'Prática (20 min): Projetar o mesmo app (ex: Spotify) nas versões Android e iOS lado a lado. Os alunos identificam 5 diferenças de componentes, navegação e tipografia.\n\nInício do exercício avaliativo: cada aluno escolhe 1 app de seu gosto que será o objeto de estudo das próximas aulas — registrar nome do app e justificativa de 3 linhas no Classroom.',
            recurso: 'Sala de aula invertida: vídeo "Material Design vs. Human Interface Guidelines" do canal Google Design (YouTube).',
            obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 07', titulo: 'Heurísticas de Nielsen Aplicadas ao Mobile\n1h20min',
            teoria: 'Teoria (50 min): As 10 Heurísticas de Nielsen no contexto mobile. As mais críticas:\n• H1 — visibilidade do status — barra de carregamento\n• H3 — controle do usuário — gesto de voltar\n• H5 — prevenção de erros — confirmação antes de deletar\n• H8 — minimalismo — tela pequena não perdoa poluição visual',
            pratica: 'Safári Mobile (30 min): Os alunos abrem o app escolhido na Aula 06 e documentam: 1 acerto genial e 1 quebra de heurística encontrados. Registrar com print + nome da heurística + justificativa. Enviar no Classroom.',
            recurso: '', obs: 'A escolha do app é o ponto de partida do exercício que vale 2pts. O app deve ser um que o aluno usa no dia a dia.',
            plano_b: 'Se os alunos não conseguirem identificar heurísticas: a professora faz ao vivo com um app de uso universal (iFood, WhatsApp) como exemplo.',
            conexao: '',
          },
          {
            id: 'AULA 08', titulo: 'Seminários Temáticos\n1h20min – Todos os 5 grupos',
            teoria: 'Orientação (10 min): Formato: 15 min de apresentação + 5 min de perguntas. Obrigatório uso de exemplos visuais (prints de apps).',
            pratica: 'Avaliação (2pts): Todos os grupos apresentam os temas teóricos escolhidos.',
            recurso: '', obs: '', plano_b: '', conexao: '', isEval: true,
          },
        ],
      },
      {
        titulo: 'BLOCO 2\nBootcamp Figma\nMaio — Junho · 6 aulas · Do esboço ao redesenho justificado',
        foco: 'Como a turma não sabe usar o Figma, este mês é 100% laboratório guiado. Eles vão construir juntos com a professora o app da "Delicatte Confeitaria", aprendendo cada botão e técnica na prática. O objetivo é que dominem a ferramenta para não travarem no Projeto Final.',
        aulas: [
          {
            id: 'AULA 09', titulo: 'Intro ao Figma e Baixa Fidelidade (Wireframes)\n1h20min',
            teoria: 'Teoria (20 min): O que é um wireframe e por que ele existe. A sequência correta: esboço em papel → wireframe → mockup → protótipo. Por que pular o wireframe custa caro. Como fazer wireframe mobile no Figma: frames cinza, texto placeholder, ícones simplificados. Tour na interface do Figma.',
            pratica: 'Code-along (60min): Delicatte. Criar os 4 frames iniciais em wireframe (Login, Home, Produto, Carrinho) usando apenas blocos cinzas, focando na Regra dos 8px e Thumb Zone aprendidas no Bloco 1.',
            recurso: '', obs: 'Começar com esboço em papel (5 min) antes de abrir o Figma. O papel desbloqueia o pensamento antes da ferramenta.',
            plano_b: 'Se a turma travar no wireframe: a professora faz ao vivo a tela inicial de um app genérico enquanto todos acompanham.',
            conexao: '',
          },
          {
            id: 'AULA 10', titulo: 'Tipografia, Cores e Componentes\n1h20min',
            teoria: 'Teoria (20 min): Como criar Estilos Locais (Cores e Fontes). O que é um Componente e sua importância para o Bottom Nav.',
            pratica: 'Prática (60 min): Aplicar a paleta da Delicatte e fontes. Criar o componente da Barra de Navegação Inferior e replicar nas telas, garantindo a área de toque de 44px.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 11', titulo: 'Constraints e Design Responsivo\n1h20min',
            teoria: 'Teoria (20 min): O app abriu em um tablet, o botão quebrou? Introdução às Constraints (ancoramento vertical/horizontal).',
            pratica: 'Prática (60 min): Configurar os cards de produtos da Delicatte para esticarem corretamente sem deformar quando o frame da tela for redimensionado.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 12', titulo: 'Alta Fidelidade (Imagens e UI Design)\n1h20min',
            teoria: 'Teoria (20 min): Sombras realistas (Drop Shadow) e plugins essenciais (Unsplash para fotos, Iconify para ícones).',
            pratica: 'Prática (60 min): Substituir blocos cinzas por fotos reais de doces, aplicar sombras sutis nos botões e arredondamentos (Border Radius). O app ganha cara profissional.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 13', titulo: 'Figma Avançado — Design System e Componentes Reutilizáveis\n1h20min',
            teoria: 'Teoria (20 min): O que é um Design System. Como criar uma biblioteca de componentes no Figma: botões, cards, inputs, ícones, nav bar. Por que a consistência é uma heurística — H4 de Nielsen. Como o Design System do projeto vai acelerar o trabalho no Bloco 3.',
            pratica: 'Prática (60 min): Criar os componentes principais do sistema visual da Delicatte e documentar no Figma.',
            recurso: '', obs: '',
            plano_b: 'Se o conceito de Master Component confundir: criar os componentes como frames comuns primeiro e converter para componente depois.',
            conexao: '',
          },
          {
            id: 'AULA 14', titulo: 'Prototipagem Interativa (Prototype)\n1h20min',
            teoria: 'Teoria (10 min): A aba Prototype. Como conectar botões às telas e escolher transições (Slide in, Dissolve).',
            pratica: 'Prática (60 min): Ligar os botões da Delicatte para criar o fluxo navegável completo. Testar o botão "Play" para simular a navegação do usuário.\n\nPrazo final 2pts: Até o dia seguinte para entregar o projetinho completo com justificativa.',
            recurso: '', obs: '', plano_b: '', conexao: '', isEval: true,
          },
        ],
      },
      {
        titulo: 'BLOCO 3\nA Fábrica: Projeto Final (App Startup)\nJunho — Julho · 6 aulas · Trabalho em equipe',
        foco: 'Com a teoria dominada (Bloco 1) e o Figma aprendido (Bloco 2), o grupo parte direto para a construção do Layout Oficial em Sprints no laboratório. A avaliação foca na qualidade visual e interativa do app.',
        aulas: [
          {
            id: 'AULA 15', titulo: 'Briefing do Projeto Final + Sprint 1: Wireframes\n1h20min',
            teoria: 'Teoria (15 min): A professora apresenta os "Briefings de Startups" (Ex: Delivery Local, PetShop, Barbearia). Os grupos escolhem o tema e criam o Trello do projeto final com as colunas ágeis (A Fazer / Fazendo / Revisão / Feito).',
            pratica: 'Sprint 1 (65 min): Cada grupo define: (1) persona do usuário do app; (2) fluxo principal — quantas telas o app vai ter; (3) paleta de cores e tipografia no Figma usando o Design System do Bloco 2, e desenham os wireframes cinzas das 5 telas principais do app.\n\nEntrega: link do Figma com persona + mapa de telas + paleta + Trello atualizado.',
            recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 16', titulo: 'Sprint 2: Design System do App\n1h20min',
            pratica: 'Prática (80 min): Os grupos definem a Tipografia, Paleta de Cores e criam os Master Components (Botões, Inputs, Cards) para manter a consistência visual em todo o app.',
            teoria: '', recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 17', titulo: 'Sprint 3: UI Design (Alta Fidelidade)\n1h20min',
            pratica: 'Prática (80 min): Aplicar a estética. Substituir blocos por imagens e textos reais. A professora faz "Auditoria Visual" mesa a mesa (cobrando contraste, zona do polegar e regras do Material/HIG estudadas na Aula 03).',
            teoria: '', recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 18', titulo: 'Sprint 4: Prototipagem Interativa\n1h20min',
            pratica: 'Prática (80 min): Conectar as telas. O app deve permitir a navegação da tela inicial até o objetivo final, usando transições suaves e microinterações de clique.',
            teoria: '', recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 19', titulo: 'Usability Lab\n1h20min',
            pratica: 'Prática (40 min): Um grupo testa o app do outro (via Figma Mirror) e aponta "bugs" de navegação.\nPrática (40 min): Os grupos consertam os bugs.',
            teoria: '', recurso: '', obs: '', plano_b: '', conexao: '',
          },
          {
            id: 'AULA 20', titulo: 'Grande Entrega (Avaliação Final)\n1h20min',
            pratica: 'Avaliação (5pts): Grupos apresentam. Critérios: Trello (1pt), Justificativas Visuais no Pitch (2pts), Qualidade e navegação do Figma (2pts). O app deve ser rodado ao vivo.',
            teoria: '', recurso: '',
            obs: 'O protótipo deve ser navegado ao vivo na apresentação — não screenshots. Testar o link antes do dia da entrega.',
            plano_b: '', conexao: '', isEval: true,
          },
        ],
      },
    ],
  },

  prog: {
    key: 'prog',
    label: 'Prog Web',
    code: 'DS_PW',
    fullname: 'Programação Web',
    info: 'Módulo 1 · Desenvolvimento de Sistemas\n160h total · 80 aulas presenciais de 1h20 · Março a Julho\nArquitetura Web, HTML5, CSS3 + JavaScript',
    avaliacao: `Estrutura Avaliativa — 10 Pontos

• Portfólio Individual publicado no GitHub Pages (1pt) — Bloco 1
• Mini-projeto prático individual (1pt) — linkado no portfólio — Bloco 1
• Projeto Final ODS (8pts) — grupos — Bloco 3

Subcritérios do Projeto Final ODS (8pts):
• Figma — protótipo de alta fidelidade navegável
• Trello — organização do projeto em sprints
• Apresentação (pitch de 7 min com navegação ao vivo)`,

    miniProjetos: [
      { num: '01', nome: 'Layout de Blog', desc: 'Cabeçalho, barra lateral, lista de postagens e rodapé.' },
      { num: '02', nome: 'Formulário de Cadastro', desc: 'Campos de nome, e-mail, senha e botão de envio.' },
      { num: '03', nome: 'Página de Login', desc: 'Campos de usuário e senha, botão de login, layout simples.' },
      { num: '04', nome: 'Landing Page de Produto', desc: 'Imagens, descrição do produto e botão de chamada à ação (CTA).' },
      { num: '05', nome: 'Menu de Navegação Responsivo', desc: 'Menu que muda de formato entre desktop e mobile.' },
      { num: '06', nome: 'Galeria de Imagens', desc: 'Grade de fotos com efeito de hover para ampliar.' },
      { num: '07', nome: 'Tabela de Preços', desc: 'Planos estilizados com cores e bordas para destacar informações.' },
      { num: '08', nome: 'Cartão de Contato', desc: 'Layout de cartão de visita com nome, cargo, telefone e e-mail.' },
      { num: '09', nome: 'Animação de Hover em Botões', desc: 'Botão com efeito de mudança de cor ou animação ao passar o mouse.' },
    ],

    blocos: [
      {
        titulo: 'BLOCO 1\nArquitetura Web, HTML5 e CSS3\nMarço — Abril · 12 aulas',
        foco: 'A turma sai do zero absoluto e chega ao HTML semântico completo e ao CSS responsivo através de um projeto guiado: a construção de um Portfólio Pessoal. Ao mesmo tempo, os alunos devem escolher 1 dos 9 mini-projetos práticos para desenvolverem sozinhos.',
        aulas: [
          { id: 'AULA 01', titulo: 'Arquitetura da Web: Do Servidor ao Clique\n1h20min presencial', teoria: 'Teoria (80 min): Visão sistêmica da TI. Relação Frontend e Backend. O caminho do dado e o papel do design e da programação na experiência do usuário. Explicação breve de como funciona a tríade do frontend: HTML, CSS e Javascript.', pratica: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 02', titulo: 'A História da Web e a Guerra dos Navegadores\n1h20min presencial', teoria: 'Teoria (80 min):\n• Introdução a Web: O que é web, www, o que é internet\n• Diferença dos navegadores\n• O que é Client-Side (Frontend) vs Server-Side (Backend)', pratica: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 03', titulo: 'Como a Internet Funciona por Baixo dos Panos\n1h20min presencial', teoria: 'Teoria (80 min): Protocolo HTTP/HTTPS, DNS (como um nome vira um IP), Servidores e Hospedagem (Qual a diferença entre Domínio e Host?).', pratica: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 04', titulo: 'Performance Básica e Ferramentas do Desenvolvedor\n1h20min presencial', teoria: 'Teoria (80 min): Apresentação profunda do Chrome DevTools (Aba Network, Aba Elements).', pratica: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 05', titulo: 'Git, Github + Setup Profissional\n1h20min presencial', teoria: 'Teoria (80 min): VS Code, Extensões, criação de conta no GitHub e boas práticas de organização de pastas e arquivos no SO. Explicar o que é Git e Github.', pratica: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          {
            id: 'AULA 06', titulo: 'Como a Web Funciona + Ambiente de Desenvolvimento\n1h20min presencial',
            teoria: 'Teoria (40 min):\n• O que é um portfólio de desenvolvedor\n• O que acontece quando você digita uma URL — cliente, servidor, HTTP\n• O papel do HTML (estrutura), CSS (visual) e JS (comportamento)\n• Apresentação do VS Code: extensões essenciais — Live Server, Prettier, Auto Rename Tag',
            codealong: 'Code-along (40 min): Instalar VS Code. Criar conta no GitHub. Criar o repositório da disciplina. Primeiro arquivo index.html com doctype e estrutura básica. Abrir com Live Server. Primeiro commit.',
            pratica: '', recurso: '', obs: '', plano_b: '', conexao: '',
          },
          { id: 'AULA 07', titulo: 'HTML5 — Estrutura Base e Tags Essenciais de Texto\n1h20min presencial', teoria: 'Teoria (25 min): Anatomia do HTML — tag, atributo, elemento, aninhamento. Tags obrigatórias: html, head, body. No head: title, meta charset, meta viewport. Tags de texto: h1–h6, p, strong, em. A regra: 1 h1 por página.', codealong: 'Code-along (55 min): Construir a estrutura base do Portfólio Pessoal com head completo. Inserir os títulos e parágrafos principais. Commit com mensagem descritiva.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 08', titulo: 'HTML5 — Imagens, Links e Atributos de Acessibilidade\n1h20min · EAD como extensão', teoria: "Teoria (25 min): tag img — src, alt (obrigatório), width, height. Formatos: JPG, PNG, SVG. tag a — href, target='_blank', rel='noopener'. Por que o alt é ético além de técnico.", codealong: 'Code-along (55 min): Inserir todas as imagens com alt descritivo. Adicionar links de navegação entre seções. Organizar a pasta /images. Commit.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 09', titulo: 'HTML5 — Tags Semânticas\n1h20min · EAD como extensão', teoria: 'Teoria (25 min): Por que semântica existe — SEO, acessibilidade, manutenção. As tags: header, nav, main, section, article, aside, footer. A diferença entre div (não diz nada) e section (tem propósito semântico).', codealong: "Code-along (55 min): Reestruturar todo o HTML usando tags semânticas. Commit com mensagem 'refatoração: HTML semântico'.", pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 10', titulo: 'HTML5 — Formulários e Validação Nativa\n1h20min · EAD como extensão', teoria: 'Teoria (25 min): A tag form. Inputs: text, email, password, number, date, checkbox, radio. label e for — por que é obrigatório (acessibilidade). Validação nativa: required, minlength, type=email.', codealong: 'Code-along (55 min): Criar o formulário de contato do portfólio. Todos os campos com label associado. Validação nativa nos campos principais. Testar a validação no navegador. Commit.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 11', titulo: 'HTML5 — Tabelas, Listas, Multimídia\n1h20min · EAD como extensão', teoria: 'Teoria (20 min): Listas: ul, ol, li. Tabelas: table, thead, tbody, tr, th, td — para dados tabulares, nunca para layout. tag video e iframe para incorporar conteúdo externo.', codealong: 'Code-along (60 min): Adicionar ao projeto os elementos restantes. Validação final do HTML no W3C. Commit de fechamento.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 12', titulo: 'CSS3 — Seletores, Cascata e Primeiras Cores\n1h20min presencial', teoria: 'Teoria (25 min): Como linkar o CSS. Sintaxe: seletor { propriedade: valor; }. Seletores de tag, classe e ID. Cascata e especificidade. Variáveis CSS: --cor-primaria, --fonte-principal. Cores: hex, rgb, hsl.', codealong: 'Code-along (55 min): Criar style.css e linkar. Criar as variáveis CSS com as cores do Figma. Aplicar a cor de fundo, cor de texto e a fonte primária via Google Fonts. Commit.', pratica: '', recurso: '', obs: 'Criar variáveis CSS desde o início. Quem não usar variáveis vai sofrer quando precisar mudar a cor primária.', plano_b: '', conexao: '' },
        ],
      },
      {
        titulo: 'BLOCO 2\nJavaScript e Interatividade\nMaio — Junho · 24 aulas',
        foco: 'Conteúdo em construção — plano completo em breve.',
        aulas: [
          { id: 'AULA 13', titulo: 'CSS3 — Tipografia e Box Model\n1h20min presencial', teoria: 'Tipografia: font-size (rem vs px), font-weight, line-height, letter-spacing. Box model: conteúdo + padding + border + margin. box-sizing: border-box.', codealong: 'Aplicar tipografia completa seguindo a hierarquia do Figma. Usar box model para criar espaçamento entre seções. Commit.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 14', titulo: 'CSS3 — Flexbox\n1h20min presencial', teoria: 'O problema que o Flexbox resolve. display:flex, flex-direction, justify-content, align-items, flex-wrap, gap. Os 3 casos de uso mais comuns.', codealong: 'Aplicar Flexbox no cabeçalho, na seção de cards do portfólio e em pelo menos 1 elemento centralizado. Commit.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 15', titulo: 'CSS3 — Grid e Responsividade\n1h20min presencial', teoria: 'CSS Grid para layouts de 2 e 3 colunas. Media queries: @media (max-width: 768px). Mobile-first — por que começar pelo menor tamanho.', codealong: 'Aplicar Grid em pelo menos 1 seção do projeto. Adicionar media queries para adaptar o layout a mobile. Commit.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 16', titulo: 'CSS3 — Pseudo-classes, Transições e Organização\n1h20min presencial', teoria: 'Pseudo-classes: :hover, :focus, :active. Transições: transition com duration e ease. Organização do CSS: variáveis → reset → base → componentes → layout → responsivo.', codealong: 'Adicionar hover e transição nos botões e links. Garantir :focus visível. Reorganizar o CSS em seções com comentários. Commit.', pratica: '', recurso: '', obs: '', plano_b: '', conexao: '' },
          { id: 'AULA 17', titulo: 'Entrega: Portfólio + Mini-projeto\n1h20min presencial', pratica: 'Entrega avaliativa (2pts): Link do portfólio publicado no GitHub Pages (1pt) + link funcional para o Mini-projeto prático individual (1pt). Entrega via Classroom até o final do dia.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '', isEval: true },
        ],
      },
      {
        titulo: 'BLOCO 3\nProjeto Final ODS\nJunho — Julho · 32 aulas',
        foco: 'Conteúdo em construção — plano completo em breve.',
        aulas: [
          { id: 'AULA 18', titulo: 'Sprint 1: Kickoff e Documentação\n2h40min presencial', pratica: 'Definição do tema ODS e criação do board no Trello. Construção da persona e demais documentos.', teoria: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
        ],
      },
    ],
  },

  prog3: {
    key: 'prog3',
    label: 'Prog Web Mod 3',
    code: 'PROG3',
    fullname: 'Programação Web — Módulo 3',
    info: 'Módulo 3 · Desenvolvimento de Sistemas [Subsequente]\nConteúdo avançado de programação web',
    avaliacao: `Estrutura Avaliativa — aguardando plano de ensino completo.\nEnvie o arquivo do plano para que os blocos e aulas sejam adicionados.`,
    blocos: [
      {
        titulo: 'BLOCO 1\nConteúdo em construção\nAguardando plano de ensino',
        foco: 'Plano de ensino ainda não cadastrado. Envie o arquivo da disciplina para adicionar os blocos e aulas.',
        aulas: [
          { id: 'AULA 01', titulo: 'Aguardando plano de ensino\nEnvie o arquivo para cadastrar as aulas', teoria: '', pratica: '', codealong: '', recurso: '', obs: '', plano_b: '', conexao: '' },
        ],
      },
    ],
  },
};
