# Versionamento do AutoMatikLab

O projeto usa **Versionamento Semântico** durante a fase beta:

```text
MAJOR.MINOR.PATCH-beta.N
```

Versão inicial deste sistema: **0.9.0-beta.1**.

- `MAJOR`: mudança incompatível na estrutura ou nos projetos salvos.
- `MINOR`: conjunto novo de recursos compatíveis.
- `PATCH`: correções sem recurso novo.
- `beta.N`: número sequencial da entrega de testes antes da versão estável.

## Atualizar a versão

Execute na raiz do projeto:

```bash
bun run version:set -- 0.9.0-beta.2
```

O comando valida a versão e atualiza `package.json` e `src/lib/version.ts` juntos. A interface lê `src/lib/version.ts`, evitando números divergentes em diferentes páginas.