# AutoMatikLab

Crie uma plataforma web de simulação educacional inspirada na navegação e proposta de https://gvensino.com.br/sim/plc/, mas com identidade e implementação próprias. O diferencial central deve ser permitir montar e usar pneumática no simulador, com base preparada para evolução futura. Comece por uma experiência inicial polida em português (PT-BR): página inicial com explicação e acesso ao simulador; uma área de simulador com painel de componentes pneumáticos (fonte de ar, válvula direcional, cilindro simples e dupla ação, botões/sensores), área de montagem em grade e painel de propriedades/controles. Implemente uma simulação inicial visual e interativa de um circuito básico, mostrando fluxo/estado e movimento do cilindro quando controles forem acionados. Inclua estrutura de biblioteca de componentes, projetos/salvar como experiência preparada na interface e seções de roadmap/expansão sem prometer recursos inexistentes. Priorize arquitetura escalável, UX clara e aparência profissional industrial/educacional. Use placeholders honestos para funcionalidades futuras. Não copie textos, marca ou ativos do site de referência.


This project was built with [Lovable](https://lovable.dev).

**Live app**: https://automatiklab.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b5b692bb-cadc-4a1b-956f-75fcf43ea2c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development
O projeto requer **Node.js 22.12 ou superior**. Com npm:

```sh
git clone <this-repository-url>
cd <repository-name>
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

O simulador usa inicialmente um modelo topológico leve: linhas ideais propagam alimentação e escape por portas conectadas, enquanto válvulas de sinal comandam pilotos 14/12. Pressão, vazão, força e perdas quantitativas ainda não fazem parte desta etapa.

As principais camadas ficam em `src/lib/pneumatics`: catálogo e portas, modelo de circuito, motor, presets e testes. A bancada e os símbolos SVG ficam em `src/components/simulator`.
