# Triage Labels

Os skills falam em termos de cinco papéis canônicos de triagem. Este arquivo mapeia esses papéis para as strings reais usadas no Linear.

| Label nos skills | Label no Linear | Significado |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage` | `needs-triage` | Mantenedor precisa avaliar esta issue |
| `needs-info` | `needs-info` | Aguardando resposta do reporter |
| `ready-for-agent` | `ready-for-agent` | Totalmente especificada, pronta para agente autônomo |
| `ready-for-human` | `ready-for-human` | Requer implementação humana |
| `wontfix` | `wontfix` | Não será executada |

Quando um skill mencionar um papel (ex.: "aplique a label de triagem ready-for-agent"), use a string correspondente da coluna "Label no Linear".

## Como aplicar labels no Linear

Labels são aplicadas via `mcp__plugin_linear_linear__save_issue` com o array `labels`:

```
mcp__plugin_linear_linear__save_issue({ id: "LIN-123", labels: ["needs-triage"] })
```

**Importante:** O array `labels` substitui todas as labels existentes. Para adicionar ou remover uma label preservando as demais, leia a issue primeiro com `get_issue`, manipule o array de labels, e reenvie o array completo.

## Criação das labels

Se as labels ainda não existirem no workspace Linear, crie-as com `mcp__plugin_linear_linear__create_issue_label`:

```
mcp__plugin_linear_linear__create_issue_label({ name: "needs-triage" })
mcp__plugin_linear_linear__create_issue_label({ name: "needs-info" })
mcp__plugin_linear_linear__create_issue_label({ name: "ready-for-agent" })
mcp__plugin_linear_linear__create_issue_label({ name: "ready-for-human" })
mcp__plugin_linear_linear__create_issue_label({ name: "wontfix" })
```

Cada label pode ser criada com `teamId` para ser específica de um time, ou sem `teamId` para ser do workspace.

Edite a coluna da direita para refletir o vocabulário que você realmente usa.
