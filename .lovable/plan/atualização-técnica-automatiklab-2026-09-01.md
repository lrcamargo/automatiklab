# Atualização técnica AutoMatikLab

## Objetivo
Preservar integralmente o layout, a estética e a navegação, alterando apenas o nome do produto e a representação técnica dos componentes pneumáticos já existentes.

## Implementação
- Renomear todas as menções visíveis e metadados de “Pneumatik Lab” para “AutoMatikLab”.
- Atualizar os glifos SVG existentes para convenções esquemáticas pneumáticas: fonte, válvulas 3/2 e 5/2, cilindros de simples e dupla ação, botão e sensor.
- Exibir junto às conexões a numeração normalizada: `1 (P)` para alimentação, `2 (A)` e `4 (B)` para trabalho, `3 (R)` e `5 (S)` para exaustão.
- Manter o motor e os presets coerentes com cada posição das válvulas: 3/2 em repouso liga 2→3 e acionada liga 1→2; 5/2 alterna 1→2 / 4→5 e 1→4 / 2→3.
- Ajustar a biblioteca para explicar em PT-BR o significado funcional das portas, sem adicionar componentes.

## Validação
- Verificar build e tipos.
- Testar no navegador os dois circuitos de exemplo, os rótulos das portas e o movimento dos cilindros.
