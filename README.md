# AutoMatikLab

Plataforma web de simulação educacional de **pneumática industrial**, em português (PT-BR).
O objetivo é permitir que estudantes e instrutores montem circuitos livremente numa bancada
virtual — arrastando componentes, ligando mangueiras porta a porta e vendo o ar, os pilotos e
os cilindros responderem — em vez de apenas rodar exemplos prontos.

**Aplicação publicada**: https://automatiklab.lovable.app

## Como este projeto é desenvolvido

Todo o desenvolvimento do AutoMatikLab é feito com **Lovable** em conjunto com um **assistente
de IA**: as funcionalidades são especificadas em linguagem natural, implementadas em par com o
assistente e sincronizadas com este repositório. Não há etapa de codificação manual fora desse
fluxo — o que está aqui foi construído inteiramente dessa forma.

## O que já funciona

- Bancada com grade, arrastar e soltar, deslocamento livre e exclusão por clique.
- Biblioteca com fonte de ar, unidade de conservação (Lubrifil), escape/silenciador,
  válvulas direcionais 3/2, 4/2, 5/2 e 5/3 de centro fechado, cilindros de simples e dupla
  ação, fim de curso, elementos lógicos OU e E, temporizadora, contador pneumático,
  retenção, escape rápido e reguladoras de fluxo uni e bidirecional, além da
  unidade de conservação simplificada.
- Acionamentos configuráveis por válvula (botão, alavanca, pedal, rolete, mola, piloto simples
  e duplo, servopiloto, solenoide) conforme a ISO 1219.
- Pilotagem pneumática real pelas portas 14 e 12, com memória nas válvulas de duplo piloto.
- Propagação topológica de alimentação e escape, movimento dos cilindros, detecção de conflito
  e de ligação direta à atmosfera.
- Vista de diagrama técnico e impressão/PDF.
- Persistência local dos circuitos no navegador: salvar, abrir, renomear, excluir e
  exportar/importar em `.json`.
- Circuitos de exemplo e testes automatizados do núcleo pneumático.

## Desenvolvimento

O projeto requer **Node.js 22.12 ou superior**.

```sh
git clone <url-deste-repositorio>
cd automatiklab
npm install
npm run dev
```

Verificações antes de enviar uma alteração:

```sh
npm run typecheck
npm test
npm run lint
npm run build
```

## Núcleo pneumático

O simulador usa um modelo topológico leve: linhas ideais propagam alimentação e escape entre
portas conectadas, enquanto as válvulas de sinal comandam os pilotos 14 e 12. Pressão, vazão,
força e perdas quantitativas ainda não fazem parte desta etapa — o foco é a lógica de comando,
que é o que os materiais didáticos de pneumática exercitam.

As principais camadas ficam em `src/lib/pneumatics`:

| Arquivo | Responsabilidade |
| --- | --- |
| `types.ts` | Tipos de componente, portas e estado de runtime |
| `catalog.ts` | Dimensões, famílias e coordenadas das portas de cada símbolo |
| `circuit.ts` | Modelo do circuito, rotas das mangueiras, rótulos técnicos e validações |
| `engine.ts` | Solucionador topológico, posições das válvulas, temporizadores e contadores |
| `presets.ts` | Circuitos de exemplo |
| `useSimulation.ts` | Laço de simulação em React |
| `storage.ts` | Persistência em `localStorage`, validação por esquema e import/export |

A bancada e a simbologia SVG ficam em `src/components/simulator`.

## Contato

- Instagram: [@instleticia](https://instagram.com/instleticia)
- TikTok: [@lercamargo](https://tiktok.com/@lercamargo)

## Referências

A simbologia segue a ISO 1219 e o material didático de pneumática do SENAI utilizado como
referência técnica (numeração DIN ISO 5599-3: `1` alimentação, `2`/`4` utilização, `3`/`5`
escapes, `10`/`12`/`14` pilotos).