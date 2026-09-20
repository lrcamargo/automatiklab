# Roadmap

## Núcleo pneumático didático

- [x] Converter a bancada para o padrão de diagrama técnico dos materiais de referência.
- [x] Adicionar visualização técnica e impressão/PDF funcional.
- [x] Reproduzir os símbolos de acionamento e restaurar o deslocamento da bancada.
- [x] Transformar botão e fim de curso em válvulas pneumáticas 3/2 conectáveis.
- [x] Implementar pilotagem pneumática pelas portas 14 e 12.
- [x] Separar alimentação, escape, conflito e posição memorizada das válvulas no motor.
- [x] Validar conexões duplicadas e remover linhas órfãs após reconfiguração.
- [x] Corrigir identificações técnicas para não repetir V, A, P ou S.
- [x] Adicionar testes automatizados do motor e do modelo de circuito.
- [x] Excluir componentes e mangueiras por clique, com edição bloqueada durante a simulação.
- [x] Remover as paredes da bancada: componentes e mangueiras em coordenadas negativas.
- [x] Editar manualmente o trajeto das mangueiras arrastando os trechos horizontal e vertical.
- [x] Corrigir a simbologia de fluxo: setas retas, tampões em T e numeração da esquerda
      para a direita.
- [x] Completar a biblioteca conforme a apostila: OU, E, temporizadora, contador, retenção,
      escape rápido, reguladoras uni e bidirecional, escape/silenciador e Lubrifil.
- [x] Implementar válvulas 4/2 e 5/3 de centro fechado (parada intermediária).
- [x] Unificar o botão pneumático na válvula 3/2 com acionamento configurável.
- [x] Reorganizar a paleta em grade de quadrados.
- [x] Persistência local dos circuitos com `localStorage`, validação por esquema e
      importação/exportação em JSON.
- [x] Corrigir a simbologia do Lubrifil, do escape, do compressor, do escape rápido e das
      reguladoras de fluxo; acrescentar a unidade de conservação simplificada.
- [x] Corrigir os acionamentos: came arredondado, mola sem traço de topo, botão em
      semicírculo e remoção dos traços laterais das caixas das válvulas.
- [ ] Revisão visual dos símbolos contra a norma, em navegadores desktop.
- [ ] Junções em T visíveis nas linhas (o motor já as resolve).
- [ ] Melhorar a operação em telas pequenas e dispositivos por toque.

## Próximas camadas

- [ ] Atividades guiadas com critérios de correção automática e modo de falhas.
- [ ] Domínio elétrico para eletropneumática e integração futura com CLP.
- [ ] Modelo físico quantitativo de pressão, vazão, força, carga e perdas.
- [ ] Contas de usuário e biblioteca de circuitos compartilhados.