# Símbolos fiéis e navegação da bancada

## Objetivo
Corrigir os acionamentos das válvulas para reproduzir a geometria técnica mostrada nas quatro imagens de referência e restaurar o deslocamento livre da bancada com o botão central do mouse.

## Implementação
- Redesenhar cada acionamento lateral em SVG conforme as referências: manual geral, botão, alavanca, pedal, came, rolete, rolete escamoteável, mola, centragem por molas, pilotos direto e servo-piloto, solenoide e servo-solenoide com acionamento manual.
- Ajustar proporções, conexões e orientação dos símbolos nos lados esquerdo e direito das válvulas, sem alterar a paleta ou adicionar componentes.
- Criar uma superfície interna maior que a área visível da bancada, preservando componentes, mangueiras, grade e pontos de conexão.
- Permitir pressionar e arrastar com o botão central para mover a visualização horizontal e verticalmente, sem conflitar com arraste de componentes ou clique de acionamento.
- Impedir a rolagem automática do navegador durante esse gesto e mostrar cursor de movimentação enquanto ele estiver ativo.
- Validar no navegador os símbolos, o deslocamento da bancada e as interações existentes.

## Detalhes técnicos
O deslocamento será feito pela própria rolagem da área da bancada, usando eventos de ponteiro no botão central. Assim, as coordenadas existentes dos componentes e conexões continuam intactas e não exigem alteração do motor pneumático.
