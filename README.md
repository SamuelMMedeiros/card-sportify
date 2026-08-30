# Game Card Studio

Crie uma SPA moderna, responsiva e pronta para uso para transformar dados de partidas esportivas em cards. Requisitos principais: 1) tela principal com uma área grande de entrada para colar texto RAW, Markdown semelhante ao exemplo fornecido ou JSON e um botão principal “Gerar cards”; 2) parser robusto que aceite listas de partidas no formato [Time A x Time B - DD/MM/YYYY - HH:MM], bullets de métricas e também JSON estruturado; 3) suportar apenas Futebol, Basquete, Futebol Americano e Baseball/Beisebol, identificando o esporte pelos cabeçalhos (⚽ 🏀 🏈 ⚾) e/ou pelos dados; 4) depois de gerar, exibir partidas agrupadas por esporte, com seções recolhíveis, contagem de jogos e ordenação por horário; 5) cada card deve ter visual esportivo premium, claro e compacto, com esporte, horário/data, times, status (a iniciar/em andamento/finalizado quando puder inferir), métricas em chips e uma área de jogadores; adaptar os campos conforme o esporte (futebol: gols, cartões, escanteios, chutes no gol, faltas; basquete: pontos, rebotes, 3PT, faltas, pontos/assistências de jogadores; baseball: runs, strikeouts, hits, HR, walks, rebatedores/roubos; futebol americano: pontos, jardas, touchdowns, turnovers etc. quando presentes); 6) barra de pesquisa instantânea após os dados carregados, atualizando a lista enquanto digito, procurando em times, jogadores, competição e métricas; 7) filtros por esporte com Todos/Futebol/Basquete/Futebol Americano/Baseball, mais filtro opcional por status e ordenação por horário/nome; 8) mostrar estado vazio, loading, erro de parsing e resumo “X partidas encontradas”; 9) persistir os dados atuais no localStorage para não perder ao recarregar e oferecer botão discreto para limpar/recomeçar; 10) permitir colar JSON diretamente e validar com mensagens úteis; 11) adicionar botão para copiar/exportar os dados estruturados em JSON, sem excesso de funcionalidades; 12) usar uma paleta moderna escura com acentos roxo/azul, tipografia limpa, cards com boa hierarquia visual, responsividade mobile-first e acessibilidade; 13) não criar navegação desnecessária: é uma SPA de uma única tela. Sugestões que considero boas e quero incluir: favoritos não são necessários agora; prefiro uma interface simples. Pode incluir um pequeno painel de resumo no topo após a geração (total de jogos, por esporte, próximos jogos). Para IA Gemini: NÃO exponha a chave de API no frontend nem coloque a chave fornecida no código do cliente. Estruture a integração de forma segura usando variável de ambiente/segredo no backend ou função server-side, com um botão opcional “Aprimorar com IA” que envia os dados estruturados ao Gemini para normalização e melhoria dos campos/cards. Se a infraestrutura server-side não estiver disponível, deixe o adaptador preparado e documente claramente qual variável de ambiente deve ser configurada, sem hardcode da chave. A IA deve apenas estruturar/normalizar os dados, nunca inventar estatísticas ausentes; preservar valores originais e sinalizar campos inferidos. Inclua dados de exemplo no estado inicial somente para demonstrar o layout, mas a área de entrada deve estar pronta para o texto fornecido pelo usuário. Gere tudo pronto, com componentes organizados e código limpo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a5fe604b-388d-4b13-8890-2dc1ffbabad6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
