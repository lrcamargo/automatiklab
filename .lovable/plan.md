# Diagrama técnico didático no simulador

## Objetivo
Aproximar a bancada dos esquemas pneumáticos dos materiais anexos, mantendo a interface, a paleta e a biblioteca atuais, e criar uma saída técnica limpa para impressão ou PDF.

## Implementação
- Remover do canvas as caixas decorativas, cabeçalhos extensos e sombras ao redor dos componentes; manter apenas o símbolo, a identificação técnica curta e os pontos de conexão.
- Recalibrar a área e as coordenadas de cada símbolo existente para que portas, vias, molas, acionamentos, escapes e cilindros fiquem alinhados como nos diagramas didáticos.
- Padronizar identificações curtas nos presets e novos itens (`1P1`, `1V1`, `1A1`, `1S1`), preservando a edição da identificação no painel lateral.
- Trocar as mangueiras curvas por conexões ortogonais e mostrar o sentido do fluxo apenas quando houver pressão válida, sem alterar a regra de alimentação exclusiva pela porta 1.
- Manter seleção, arraste e acionamento direto por áreas invisíveis do editor, com feedback visual discreto sem recriar cartões ao redor dos símbolos.
- Adicionar `Imprimir / Exportar` e uma visualização técnica isolada: fundo claro, traços escuros, linhas de pressão destacadas, símbolos, portas, identificações e conexões; ocultar navegação, painéis, botões, grade e controles ao imprimir/salvar em PDF pelo navegador.
- Diferenciar explicitamente na barra o modo “Editor” da “Saída técnica”, sem habilitar armazenamento de projetos ainda inexistente.

## Validação
- Conferir visualmente os presets de simples e dupla ação em repouso e acionados.
- Verificar portas 1/2/3/4/5, sentido das setas e movimento dos cilindros.
- Abrir a saída técnica, validar a prévia de impressão e testar desktop sem sobreposições.
- Confirmar build sem erros.

## Detalhes técnicos
- Concentrar o desenho técnico em SVG reutilizável para que editor e impressão usem exatamente os mesmos símbolos.
- Usar CSS de impressão e uma camada de diagrama dedicada, sem adicionar biblioteca de PDF ou novos componentes pneumáticos.
